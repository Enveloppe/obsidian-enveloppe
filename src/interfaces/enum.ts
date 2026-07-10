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

export enum Placeholder {
	Smartkey = "smartkey",
	Main = "main",
	Ci = "ci",
	Share = "share",
	Docs = "docs",
	Regex = "regex",
	FolderImage = "docs/images",
	Format = "py, mdx",
	Banner = "banner",
	ExcludedFolder = "_assets, Archive, /^_(.*)/gi",
	FieldName = "field_name",
	AutoCleanFolder = "docs/assets/js, docs/assets/logo, /\\.js$/",
	Merge = "[PUBLISHER] MERGE",
}
