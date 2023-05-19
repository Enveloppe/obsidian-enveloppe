import {FolderSettings, GithubTiersVersion, TextCleaner, TypeOfEditRegex} from "./interface";
import GithubPublisher from "../main";
import {noticeLog} from "../src/utils";
import i18next from "i18next";
import settings from "../../tests/fixtures/githubPublisherSettings";

export interface OldSettings {
	githubRepo: string;
	githubName: string;
	GhToken: string;
	githubBranch: string;
	shareKey: string;
	excludedFolder: string[];
	fileMenu: boolean;
	editorMenu: boolean;
	downloadedFolder: string;
	folderDefaultName: string;
	yamlFolderKey: string;
	rootFolder: string;
	workflowName: string;
	customCommitMsg: string;
	embedImage: boolean;
	defaultImageFolder: string;
	autoCleanUp: boolean;
	autoCleanUpExcluded: string[];
	folderNote: boolean;
	folderNoteRename: string;
	convertWikiLinks: boolean;
	convertForGithub: boolean;
	subFolder: string;
	embedNotes: boolean;
	copyLink: boolean;
	mainLink: string;
	linkRemover: string;
	hardBreak: boolean;
	logNotice: boolean;
	convertDataview: boolean;
	useFrontmatterTitle: boolean;
	censorText: TextCleaner[];
	inlineTags: boolean;
	dataviewFields: string[];
	frontmatterTitleKey: string;
	excludeDataviewValue: string[];
	metadataFileFields: string[];
	shareExternalModified: boolean;
	automaticallyMergePR: boolean;
	metadataExtractorPath: string;
	convertInternalNonShared: boolean;
	frontmatterTitleRegex: string;
	frontmatterTitleReplacement: string;
	tiersForApi: GithubTiersVersion;
	hostname: string;
}

export async function migrateSettings(old: OldSettings, plugin: GithubPublisher) {
	if (Object.keys(old).includes("editorMenu")) {
		noticeLog(i18next.t("informations.migrating.oldSettings"), plugin.settings);
		plugin.settings = {
			github:
				{
					user: old.githubName ? old.githubName : plugin.settings.github.user ? plugin.settings.github.user : "",
					repo: old.githubRepo ? old.githubRepo : plugin.settings.github.repo ? plugin.settings.github.repo : "",
					token: old.GhToken ? old.GhToken : plugin.settings.github.token ? plugin.settings.github.token : "",
					branch: old.githubBranch,
					automaticallyMergePR: old.automaticallyMergePR,
					api: {
						tiersForApi: old.tiersForApi,
						hostname: old.hostname,
					},
					workflow: {
						name: old.workflowName,
						commitMessage: old.customCommitMsg ?? plugin.settings.github.workflow.commitMessage ?? "[PUBLISHER] MERGE",
					},
					otherRepo: [],
				},
			upload: {
				behavior: old.downloadedFolder as FolderSettings,
				defaultName: old.folderDefaultName,
				rootFolder: old.rootFolder,
				yamlFolderKey: old.yamlFolderKey,
				frontmatterTitle: {
					enable: old.useFrontmatterTitle,
					key: old.frontmatterTitleKey,
				},
				replaceTitle: [{
					regex: old.frontmatterTitleRegex,
					replacement: old.frontmatterTitleReplacement,
					type: TypeOfEditRegex.title
				}],
				replacePath: [
					{
						regex: old.subFolder,
						replacement: "",
						type: TypeOfEditRegex.path
					}
				],
				autoclean: {
					enable: old.autoCleanUp,
					excluded: old.autoCleanUpExcluded,
				},
				folderNote: {
					enable: old.folderNote,
					rename: old.folderNoteRename,
				},
				metadataExtractorPath: old.metadataExtractorPath,
			},
			conversion: {
				hardbreak: old.hardBreak,
				dataview: old.convertDataview,
				censorText: old.censorText,
				tags: {
					inline: old.inlineTags,
					exclude: old.excludeDataviewValue,
					fields: old.dataviewFields,
				},
				links: {
					internal: old.convertForGithub,
					unshared: old.convertInternalNonShared,
					wiki: old.convertWikiLinks,
					slugify: false,
				},
			},
			embed: {
				attachments: old.embedImage,
				keySendFile: old.metadataFileFields,
				notes: old.embedNotes,
				folder: old.defaultImageFolder,
			},
			plugin: {
				shareKey: old.shareKey,
				fileMenu: old.fileMenu,
				editorMenu: old.editorMenu,
				excludedFolder: old.excludedFolder,
				copyLink: {
					enable: old.copyLink,
					links: old.mainLink,
					removePart: old.linkRemover.split(/[,\n]\W*/).map((s) => s.trim()),
					addCmd: false,
				},
				noticeError: old.logNotice,
				displayModalRepoEditing: false
			}
		};
		await plugin.saveSettings();
	}
	if (!(plugin.settings.upload.replaceTitle instanceof Array)) {
		noticeLog(i18next.t("informations.migrating.fileReplace"), plugin.settings);
		plugin.settings.upload.replaceTitle = [plugin.settings.upload.replaceTitle];
		await plugin.saveSettings();
	}
	//@ts-ignore
	if (plugin.settings.upload.subFolder && (!plugin.settings.upload.replacePath.find((e) => e.regex === "/" + plugin.settings.upload.subFolder))) {
		noticeLog(i18next.t("informations.migrating.subFolder"), plugin.settings);
		//@ts-ignore
		if (plugin.settings.upload.subFolder.length > 0) {
			plugin.settings.upload.replacePath.push({
				//@ts-ignore
				regex: "/" + plugin.settings.upload.subFolder,
				replacement: "",
				type: TypeOfEditRegex.path
			});
		}
		//delete plugin.settings.upload.subFolder from settings;
		//@ts-ignore
		delete plugin.settings.upload.subFolder;
		await plugin.saveSettings();
	}
	for (const censor of plugin.settings.conversion.censorText) {
		if (censor.flags) {
			//enclose regex in / / and add flags
			censor.entry = "/" + censor.entry + "/" + censor.flags;
			delete censor.flags;
			await plugin.saveSettings();
		}
	}
	//@ts-ignore
	if (plugin.settings.github.worflow) {
		//@ts-ignore
		const worflow = plugin.settings.github.worflow;
		plugin.settings.github.workflow = {
			//@ts-ignore
			name: worflow.workflowName,
			//@ts-ignore
			commitMessage: worflow.customCommitMsg,
		};
		//@ts-ignore
		delete plugin.settings.github.worflow;
		await plugin.saveSettings();
	}
	for (const repo of plugin.settings.github.otherRepo) {
		const workflow = {
			//@ts-ignore
			name: plugin.settings.github.worflow?.workflowName ?? plugin.settings.github.workflow.name,
			//@ts-ignore
			commitMessage: plugin.settings.github.worflow?.customCommitMsg ?? plugin.settings.github.workflow.commitMessage,
		};
		if (!repo.workflow) {
			repo.workflow = workflow;
			await plugin.saveSettings();
		}
		//@ts-ignore
		if (repo.worflow) {
			//@ts-ignore
			const worflow = repo.worflow;
			if (worflow.workflowName) {
				repo.workflow.name = worflow.workflowName;
			}
			if (worflow.customCommitMsg) {
				repo.workflow.commitMessage = worflow.customCommitMsg;
			}
			//@ts-ignore
			delete repo.worflow;
			await plugin.saveSettings();
		}
		if (!repo.copyLink) {
			repo.copyLink = {
				links: "",
				removePart: [],
			};
			await plugin.saveSettings();
		}
	}
}
