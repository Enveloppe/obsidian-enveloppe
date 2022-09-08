import {GitHubPublisherSettings} from "../settings/interface";
import {
	App,
	FrontMatterCache,
	MetadataCache,
	Notice,
	parseFrontMatterTags,
	parseYaml,
	stringifyYaml,
	TFile,
} from "obsidian";
import {getDataviewPath} from "./filePathConvertor";
import {getAPI, Link} from "obsidian-dataview";
import {noticeLog} from "../src/utils";
import {convertLinkCitation, convertWikilinks} from "./convertLinks";

export function addHardLineBreak(text: string, settings: GitHubPublisherSettings, frontmatter: FrontMatterCache): string {
	/*
	* Convert soft line breaks to hard line breaks, adding two space at the end of the line.
	* This settings can be set for global or perfile using a frontmatter key 'hardbreak'
	* If both are set, the perfile setting will override the global setting.
	* If neither are set, the default is false.
	 */
	try {
		text = text.replace(/^\s*\\\s*$/gmi, '<br/>');
		const hardBreak = frontmatter?.hardbreak !== undefined ? frontmatter?.hardbreak : settings.hardBreak;
		if (hardBreak) {
			text = text.replace(/\n/gm, '  \n');
		}
		return text;
	}
	catch (e) {
		noticeLog(e, settings);
		return text;
	}
}

async function addToYAML(text: string, toAdd: string[]): Promise<string> {
	/*
	* Add the string list to the YAML frontmatter tags key
	* If the tags key does not exist, it will be created
	 */
	const yaml = text.split("---")[1];
	const yamlObject = parseYaml(yaml);
	if (yamlObject.tag) {
		toAdd = [...new Set([...toAdd, ...yamlObject.tag])];
	}
	if (yamlObject.tags) {
		yamlObject.tags = [...new Set([...yamlObject.tags, ...toAdd])];
	} else {
		yamlObject.tags = toAdd;
	}
	const returnToYaml = stringifyYaml(yamlObject);
	const fileContentsOnly= text.split("---").slice(2).join("---");
	return `---\n${returnToYaml}---\n${fileContentsOnly}`;
}

export async function addInlineTags(
	settings: GitHubPublisherSettings,
	file:TFile,
	metadataCache: MetadataCache,
	app: App): Promise<string> {
	/*
	* Add inlines tags to frontmatter tags keys.
	* Duplicate tags will be removed.
	*/
	const text = await app.vault.cachedRead(file);

	if (!settings.inlineTags) {
		return text;
	}
	const inlineTags = metadataCache.getFileCache(file)?.tags;
	const inlineTagsInText= inlineTags ? inlineTags.map(
		t => t.tag.replace('#', '')
			.replaceAll('/', '_')) : [];
	const frontmatterTags = parseFrontMatterTags(metadataCache.getFileCache(file)?.frontmatter);

	const yamlTags = frontmatterTags ? frontmatterTags.map(t =>
		t.replace('#', '')
			.replaceAll("/", "_")) : [];
	const toAdd = [...new Set([...inlineTagsInText, ...yamlTags])]
	if (toAdd.length > 0) {
		return await addToYAML(text, toAdd);
	}
	return text;
}

export function censorText(text: string, settings: GitHubPublisherSettings): string {
	/*
	* Censor text using the settings
	 */
	if (!settings.censorText) {
		return text;
	}
	for (const censor of settings.censorText) {
		const regex = new RegExp(censor.entry, 'ig');
		// @ts-ignore
		text = text.replaceAll(regex, censor.replace);
	}
	return text;
}

function dataviewExtract(fieldValue: Link, settings: GitHubPublisherSettings) {
	/*
	* stringify the dataview link by extracting the value from the link
	* extract the alt text if it exists, otherwise extract the filename
	* return null if the alt text or the filename is excluded
	 */
	const basename = (name: string) =>
		/([^/\\.]*)(\..*)?$/.exec(name)[1];
	const filename = basename(fieldValue.path).toString();
	const display = fieldValue.display ? fieldValue.display.toString() : filename;
	if (!settings.excludeDataviewValue.includes(display) && !settings.excludeDataviewValue.includes(filename)) {
		return display;
	}
	return null;
}

export async function convertInlineDataview(text: string, settings: GitHubPublisherSettings, sourceFile: TFile, app: App) {
	/*
	* Add inlines dataview or frontmatter keys to the tags key in the frontmatter
	* Will be recursive for array
	* stringify with extract alt text for links
	 */
	// @ts-ignore
	if (settings.dataviewFields.length === 0 || !app.plugins.enabledPlugins.has('dataview')) {
		return text;
	}
	const dvApi = getAPI();
	const dataviewLinks = await dvApi.page(sourceFile.path);
	const valueToAdd:string[] = [];
	for (const field of settings.dataviewFields) {
		const fieldValue = dataviewLinks[field];
		if (fieldValue) {
			if (fieldValue.constructor.name === 'Link') {
				const stringifyField = dataviewExtract(fieldValue, settings);
				valueToAdd.push(stringifyField);
			} else if (fieldValue.constructor.name === 'Array') {
				for (const item of fieldValue) {
					let stringifyField = item;
					if (item.constructor.name === 'Link') {
						stringifyField = dataviewExtract(item, settings);
						valueToAdd.push(stringifyField);
					}
					else if (!settings.excludeDataviewValue.includes(stringifyField.toString())) {
						valueToAdd.push(stringifyField.toString());
					}
				}
			} else if (!settings.excludeDataviewValue.includes(fieldValue.toString())) {
				valueToAdd.push(fieldValue.toString());
			}
		}
	}
	if (valueToAdd.length > 0) {
		return await addToYAML(text, valueToAdd.filter(Boolean));
	}
	return text;
}

export async function convertDataviewQueries(
	text: string,
	path: string,
	settings: GitHubPublisherSettings,
	app: App,
	metadataCache: MetadataCache,
	frontmatter: FrontMatterCache,
	sourceFile: TFile): Promise<string>
{
	/*
	* Convert dataview queries to markdown
	* Empty the block if settings.convertDataview is false or if the frontmatter key dataview is false
	* The global settings can be overrides by the frontmatter key dataview
	 */
	/* Credit : Ole Eskild Steensen from Obsidian Digital Garden */
	// @ts-ignore
	if (!app.plugins.enabledPlugins.has('dataview')) {
		return text;
	}
	const vault = app.vault;
	let replacedText = text;
	const dataviewRegex = /```dataview(.+?)```/gsm;
	const dvApi = getAPI();
	const matches = text.matchAll(dataviewRegex);
	if (!matches) return;
	const settingsDataview = frontmatter.dataview !== undefined ? frontmatter?.dataview : settings.convertDataview;
	for (const queryBlock of matches){
		try {
			const block = queryBlock[0];
			const query = queryBlock[1];
			let md = settingsDataview ? await dvApi.tryQueryMarkdown(query, path) : "";
			const dataviewPath = getDataviewPath(md, settings, vault);
			md = convertLinkCitation(md, settings, dataviewPath, metadataCache, sourceFile, vault);
			md = convertWikilinks(md, frontmatter, settings, dataviewPath);
			replacedText = replacedText.replace(block, md);

		} catch (e) {
			noticeLog(e, settings);
			new Notice('Unable to render dataview query. Please update the dataview plugin to the last version.')
			return queryBlock[0];
		}
	}
	return replacedText;
}
