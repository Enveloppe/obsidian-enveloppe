/**
 * @enum TypeOfEditRegex
 * @description Allow to set a value for the regex replace settings, to replace the path or the title of a file with a regex
 * - `path` : replace the path of the file
 * - `title` : replace the title of the file
 */
export enum TypeOfEditRegex {
	Path = "path",
	Title = "title",
}

export enum EnumbSettingsTabId {
	Github = "github-configuration",
	Upload = "upload-configuration",
	Text = "text-conversion",
	Embed = "embed-configuration",
	Plugin = "plugin-settings",
	Help = "help",
}

/**
 * Allow to set a value for the folder settings
 * @enum FolderSettings
 */
export enum FolderSettings {
	/** Use YAML frontmatter for settings the path */
	Yaml = "yaml",
	/** Use the obsidian tree */
	Obsidian = "obsidian",
	/** Use a fixed folder and send all in it */
	Fixed = "fixed",
}

/**
 * @enum GithubTiersVersion
 * @description Allow to set a value for the github tiers
 */
export enum GithubTiersVersion {
	Free = "Github Free/Pro/Team (default)",
	Entreprise = "Enterprise",
}
