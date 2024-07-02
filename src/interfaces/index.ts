//export interface in a file to prevent breaking & allow to easily find the interface

import { DEFAULT_SETTINGS, FIND_REGEX, TOKEN_PATH } from "src/interfaces/constant";
import {
	EnumbSettingsTabId,
	FolderSettings,
	GithubTiersVersion,
	TypeOfEditRegex,
} from "src/interfaces/enum";
import type {
	Deleted,
	ListEditedFiles,
	UploadedFiles,
} from "src/interfaces/list_edited_files";
import type {
	EnveloppeSettings,
	GithubRepo,
	LinkedNotes,
	OverrideAttachments,
	Path,
	Properties,
	PropertiesConversion,
	RegexReplace,
	Repository,
	SetRepositoryFrontmatter,
	TextCleaner,
} from "src/interfaces/main";
import type {
	MonoProperties,
	MonoRepoProperties,
	MultiProperties,
	MultiRepoProperties,
} from "src/interfaces/properties";
import type { MetadataExtractor } from "src/interfaces/settings";

export {
	DEFAULT_SETTINGS,
	EnumbSettingsTabId,
	FIND_REGEX,
	FolderSettings,
	GithubTiersVersion,
	TOKEN_PATH,
	TypeOfEditRegex,
};

export type {
	Deleted,
	EnveloppeSettings,
	GithubRepo,
	LinkedNotes,
	ListEditedFiles,
	MetadataExtractor,
	MonoProperties,
	MonoRepoProperties,
	MultiProperties,
	MultiRepoProperties,
	OverrideAttachments,
	Path,
	Properties,
	PropertiesConversion,
	RegexReplace,
	Repository,
	SetRepositoryFrontmatter,
	TextCleaner,
	UploadedFiles,
};
