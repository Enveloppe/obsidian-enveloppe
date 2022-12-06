import {App, FrontMatterCache, MetadataCache, Notice, Platform, TFile, Vault} from 'obsidian'
import {GitHubPublisherSettings, MetadataExtractor, RepoFrontmatter} from '../settings/interface'
import Publisher from "../publishing/upload";
import {informations} from '../i18n'
import type { StringFunc } from "../i18n";
import {getReceiptFolder} from "../contents_conversion/filePathConvertor";
import {frontmatterConvert} from "../settings/interface";
import GithubPublisher from "../main";


export async function convertOldSettings(settingsToConvert: string, plugin: GithubPublisher) {
	const settings = plugin.settings
	// @ts-ignore
	const oldSettings = settings[settingsToConvert] as unknown as string
	if (typeof oldSettings === "string") {
		// @ts-ignore
		settings[settingsToConvert] = oldSettings === "" ? [] : oldSettings.split(/[,\n]\W*/)
		await plugin.saveSettings();
	}
	// @ts-ignore
	settings[settingsToConvert] = settings[settingsToConvert].filter((e: string) => e !== "")
	await plugin.saveSettings();
}

export function noticeLog(message: string, settings: GitHubPublisherSettings) {
	/**
	 * Create a notice message for the log
	 * @param message: string
	 * @param settings: GitHubPublisherSettings
	 * @returns null
	 */
	if (settings.logNotice) {
		new Notice(message);
	} else {
		console.log(message);
	}
}

export async function getSettingsOfMetadataExtractor(app: App, settings: GitHubPublisherSettings) {
	/**
	 * Get the settings of the metadata extractor plugin
	 * @param app: App
	 * @param settings: GitHubPublisherSettings
	 * @returns settings of the metadata extractor plugin
	 */
	// @ts-ignore
	if (Platform.isMobile || !Array.from(app.plugins.enabledPlugins).includes("metadata-extractor") || (settings.metadataExtractorPath.length === 0)) return null;

	const metadataExtractor: MetadataExtractor = {
		allExceptMdFile: null,
		metadataFile: null,
		tagsFile: null,
	}

	const path = `${app.vault.configDir}/plugins/metadata-extractor`;
	// @ts-ignore
	const plugin = app.plugins.plugins['metadata-extractor']
	if (plugin && plugin.settings) {
		if (plugin.settings['allExceptMdFile'].length > 0) {
			//get file from plugins folder in .obsidian folder
			metadataExtractor.allExceptMdFile = path + '/' + plugin.settings['allExceptMdFile'];
		}
		if (plugin.settings['metadataFile'].length > 0) {
			metadataExtractor.metadataFile= path + '/' + plugin.settings['metadataFile'];
		}
		if (plugin.settings['tagFile'].length > 0) {
			metadataExtractor.tagsFile = path + '/' + plugin.settings['tagFile'];
		}
		return metadataExtractor
	}
	return null;
}



export function disablePublish (app: App, settings: GitHubPublisherSettings, file:TFile) {
	/**
	 * Disable publishing if the file hasn't a valid frontmatter or if the file is in the folder list to ignore
	 * @param app: App
	 * @param settings: GitHubPublisherSettings
	 * @param file: TFile
	 * @returns boolean with the meta[settings.shareKey] if valid or false if not
	 */
	const fileCache = app.metadataCache.getFileCache(file)
	const meta = fileCache?.frontmatter
	const folderList = settings.excludedFolder
	if (meta === undefined) {
		return false
	} else if (folderList.length > 0) {
		for (let i = 0; i < folderList.length; i++) {
			const isRegex = folderList[i].match(/^\/(.*)\/[igmsuy]*$/);
			const regex = isRegex ? new RegExp(isRegex[1], isRegex[2]) : null;
			if (regex && regex.test(file.path)) {
				return false;
			} else if (file.path.contains(folderList[i].trim())) {
				return false
			}
		}
	}
	return meta[settings.shareKey]
}

function checkSlash(
	link: string
) {
	/**
	 * Check if the link has a slash at the end and if not add it
	 * @param link: string
	 * @returns string with the link with a slash at the end
	 */
	const slash = link.match(/\/*$/);
	if (slash[0].length != 1) {
		link = link.replace(/\/*$/, "") + "/";
	}
	return link;
}


export async function createLink(file: TFile, repo: RepoFrontmatter | RepoFrontmatter[], metadataCache: MetadataCache, vault: Vault, settings: GitHubPublisherSettings) {
	/**
	 * Create the link for the file and add it to the clipboard
	 * The path is based with the receipt folder but part can be removed using settings.
	 * By default, use a github.io page for the link.
	 * @param file: TFile
	 * @param settings: GitHubPublisherSettings
	 * @param metadataCache: MetadataCache
	 * @returns null
	 */
	if (!settings.copyLink) {
		return;
	}
	let filepath = getReceiptFolder(file, settings, metadataCache, vault)

	let baseLink = settings.mainLink;
	if (baseLink.length === 0) {
		if (repo instanceof Array) {
			baseLink = `https://${settings.githubName}.github.io/${settings.githubRepo}/`
		} else {
			baseLink = `https://${repo.owner}.github.io/${repo.repo}/`
		}
	}
	const keyRepo = metadataCache.getFileCache(file)?.frontmatter['baselink']
	if (keyRepo !== undefined) {
		baseLink = keyRepo
	}

	baseLink = checkSlash(baseLink);
	if (settings.linkRemover.length > 0){
		const tobeRemoved = settings.linkRemover.split(',')
		for (const part of tobeRemoved) {
			if (part.length > 0) {
				filepath = filepath.replace(part.trim(), '')
			}
		}
	}
	const url = encodeURI(baseLink + filepath.replace(".md", ''))
	await navigator.clipboard.writeText(url);
	return;

}

export async function noticeMessage(PublisherManager: Publisher, file: TFile|string, settings: GitHubPublisherSettings, repo: RepoFrontmatter|RepoFrontmatter[]){
	if (repo instanceof Array) {
		for (const repository of repo) {
			await noticeMessageOneRepo(PublisherManager, file, settings, repository)
		}
	} else {
		noticeMessageOneRepo(PublisherManager, file, settings, repo)
	}
}

async function noticeMessageOneRepo(PublisherManager: Publisher, file: TFile | string, settings: GitHubPublisherSettings, repo: RepoFrontmatter) {
	/**
	 * Create a notice message for the sharing ; the message can be delayed if a workflow is used. 
	 * @param PublisherManager: Publisher
	 * @param file: TFile | string
	 * @param settings: GitHubPublisherSettings
	 * @returns null
	 */
	const noticeValue = (file instanceof TFile) ? '"' + file.basename + '"' : file
	if (settings.workflowName.length > 0) {
		new Notice((informations("sendMessage") as StringFunc)([noticeValue, repo.owner+':'+repo.repo, `.\n${informations("waitingWorkflow")}`]));
		const successWorkflow = await PublisherManager.workflowGestion(repo);
		if (successWorkflow) {
			new Notice(
				(informations("successfullPublish") as StringFunc)([noticeValue, repo.owner+':'+repo.repo])
			);
		}
	}
	else {
		new Notice(
			(informations("successfullPublish") as StringFunc)([noticeValue, repo.owner+':'+repo.repo])
		);
	}
}

export function trimObject(obj: {[p: string]: string}){
	/**
	 * Trim the object values
	 * @param obj: {[p: string]: string}
	 * @returns {[p: string]: string}
	*/
	const trimmed = JSON.stringify(obj, (key, value) => {
		if (typeof value === 'string') {
			return value.trim().toLowerCase();
		}
		return value;
	});
	return JSON.parse(trimmed);
}

export function isAttachment(filename: string) {
	return filename.match(/(png|jpe?g|gif|bmp|svg|mp[34]|web[mp]|wav|m4a|ogg|3gp|flac|ogv|mov|mkv|pdf)$/i)
}



export function getFrontmatterCondition(frontmatter: FrontMatterCache, settings: GitHubPublisherSettings) {
	let imageDefaultFolder = null;
	if (settings.defaultImageFolder.length > 0) {
		imageDefaultFolder = settings.defaultImageFolder;
	} else if (settings.folderDefaultName.length > 0) {
		imageDefaultFolder = settings.folderDefaultName;
	}
	const settingsConversion: frontmatterConvert = {
		convertWiki: settings.convertWikiLinks,
		attachment: settings.embedImage,
		embed: settings.embedNotes,
		attachmentLinks: imageDefaultFolder,
		links: true,
		removeEmbed: false,
		dataview: settings.convertDataview,
		hardbreak: settings.hardBreak,
	}
	if (frontmatter.links !== undefined) {
		if (typeof frontmatter.links === 'object') {
			if (frontmatter.links.convert !== undefined) {
				settingsConversion.links = frontmatter.links.convert
			} if (frontmatter.links.internals !== undefined) {
				settingsConversion.links = frontmatter.links.internals
			}
			if (frontmatter.links.mdlinks !== undefined) {
				settingsConversion.convertWiki = frontmatter.links.mdlinks
			}
		} else {
			settingsConversion.links = frontmatter.links
		}
	}
	if (frontmatter.embed !== undefined) {
		if (typeof frontmatter.embed === 'object') {
			if (frontmatter.embed.send !== undefined) {
				settingsConversion.embed = frontmatter.embed.send
			}
			if (frontmatter.embed.remove !== undefined) {
				settingsConversion.removeEmbed = frontmatter.embed.remove
			}
		} else {
			settingsConversion.embed = frontmatter.embed
		}
	}
	if (frontmatter.attachment !== undefined) {
		if (typeof frontmatter.attachment === 'object') {
			if (frontmatter.attachment.send !== undefined) {
				settingsConversion.attachment = frontmatter.attachment.send
			}
			if (frontmatter.attachment.folder !== undefined) {
				settingsConversion.attachmentLinks = frontmatter.attachment.folder
			}
		} else {
			settingsConversion.attachment = frontmatter.attachment
		}
	}
	if (frontmatter.attachmentLinks !== undefined) {
		settingsConversion.attachmentLinks = frontmatter.attachmentLinks.toString().replace(/\/$/, '')
	}
	if (frontmatter.mdlinks !== undefined) {
		settingsConversion.convertWiki = frontmatter.mdlinks
	}
	if (frontmatter.removeEmbed !== undefined) {
		settingsConversion.removeEmbed = frontmatter.removeEmbed
	}
	if (frontmatter.dataview !== undefined) {
		settingsConversion.dataview = frontmatter.dataview
	} if (frontmatter.hardbreak !== undefined) {
		settingsConversion.hardbreak = frontmatter.hardbreak
	}
	return settingsConversion
}

export function getRepoFrontmatter(settings: GitHubPublisherSettings, frontmatter?: FrontMatterCache,) {
	let repoFrontmatter : RepoFrontmatter = {
		branch: settings.githubBranch,
		repo: settings.githubRepo,
		owner: settings.githubName,
		autoclean: settings.autoCleanUp,
	}
	if (!frontmatter) {
		return repoFrontmatter
	}
	if (frontmatter.multipleRepo !== undefined) {
		const multipleRepo = parseMultipleRepo(frontmatter, repoFrontmatter)
		if (multipleRepo.length === 1) {
			return multipleRepo[0] as RepoFrontmatter
		}
		return multipleRepo
	}
	else if (frontmatter.repo !== undefined) {
		if (typeof frontmatter.repo === 'object') {
			if (frontmatter.repo.branch !== undefined) {
				repoFrontmatter.branch = frontmatter.repo.branch
			}
			if (frontmatter.repo.repo !== undefined) {
				repoFrontmatter.repo = frontmatter.repo.repo
			}
			if (frontmatter.repo.owner !== undefined) {
				repoFrontmatter.owner = frontmatter.repo.owner
			}

		} else {
			const repo = frontmatter.repo.split('/')
			repoFrontmatter = repositoryStringSlice(repo, repoFrontmatter)
		}
	}
	if (frontmatter.autoclean !== undefined) {
		repoFrontmatter.autoclean = frontmatter.autoclean
	}
	return repoFrontmatter
}


function parseMultipleRepo(frontmatter: FrontMatterCache, repoFrontmatter: RepoFrontmatter) {
	const multipleRepo: RepoFrontmatter[] = []
	// Yaml example :
	// multipleRepo:
	//   - repo: repo1
	//     owner: owner1
	//     branch: branch1
	//     autoclean: true
	//   - repo: repo2
	//     owner: owner2
	//     branch: branch2
	//     autoclean: false
	if (frontmatter.multipleRepo instanceof Array && frontmatter.multipleRepo.length > 0) {
		for (const repo of frontmatter.multipleRepo) {
			if (typeof repo === 'object') {
				const repository: RepoFrontmatter = {
					branch: repoFrontmatter.branch,
					repo: repoFrontmatter.repo,
					owner: repoFrontmatter.owner,
					autoclean: false,
				}
				if (repo.branch !== undefined) {
					repository.branch = repo.branch
				}
				if (repo.repo !== undefined) {
					repository.repo = repo.repo
				}
				if (repo.owner !== undefined) {
					repository.owner = repo.owner
				} if (repo.autoclean !== undefined) {
					repository.autoclean = repo.autoclean
				}
				multipleRepo.push(repository)
			} else {
				//is string
				const repoString = repo.split('/')
				const repository: RepoFrontmatter = {
					branch: repoFrontmatter.branch,
					repo: repoFrontmatter.repo,
					owner: repoFrontmatter.owner,
					autoclean: false,
				}
				multipleRepo.push(repositoryStringSlice(repoString, repository))
			}
		}
	}
	return multipleRepo
}



function repositoryStringSlice(repo: string, repoFrontmatter: RepoFrontmatter) {
	const newRepo: RepoFrontmatter = {
		branch: repoFrontmatter.branch,
		repo: repoFrontmatter.repo,
		owner: repoFrontmatter.owner,
		autoclean: false,
	}
	if (repo.length >=4) {
		newRepo.branch = repo[2]
		newRepo.repo = repo[1]
		newRepo.owner = repo[0]
		newRepo.autoclean = repo[3] === 'true'
	}
	if (repo.length === 3) {
		newRepo.branch = repo[2]
		newRepo.repo = repo[1]
		newRepo.owner = repo[0]
	} else if (repo.length === 2) {
		newRepo.repo = repo[1]
		newRepo.owner = repo[0]
	} else if (repo.length === 1) {
		newRepo.repo = repo[0]
	}
	return newRepo
}
