
/**
 * @enum TypeOfEditRegex
 * @description Allow to set a value for the regex replace settings, to replace the path or the title of a file with a regex
 * - `path` : replace the path of the file
 * - `title` : replace the title of the file
 */
export enum TypeOfEditRegex {
	path = "path",
	title = "title",
}

export enum EnumbSettingsTabId {
	github = "github-configuration",
	upload = "upload-configuration",
	text = "text-conversion",
	embed = "embed-configuration",
	plugin = "plugin-settings",
	help = "help",
}

/**
 * Allow to set a value for the folder settings
 * @enum FolderSettings
 */
export enum FolderSettings {
	/** Use YAML frontmatter for settings the path */
	yaml = "yaml",
	/** Use the obsidian tree */
	obsidian = "obsidian",
	/** Use a fixed folder and send all in it */
	fixed = "fixed",
}

/**
 * @enum GithubTiersVersion
 * @description Allow to set a value for the github tiers
 */
export enum GithubTiersVersion {
	free = "Github Free/Pro/Team (default)",
	entreprise = "Enterprise",
}