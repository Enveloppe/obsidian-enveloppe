//export interface in a file to prevent breaking & allow to easily find the interface

import { DEFAULT_SETTINGS,FIND_REGEX, TOKEN_PATH } from "./constant";
import { GithubTiersVersion } from "./enum";
import { GitHubPublisherSettings, Repository, SetRepositoryFrontmatter } from "./main";

export {DEFAULT_SETTINGS,FIND_REGEX,GithubTiersVersion,TOKEN_PATH};

export type {
	GitHubPublisherSettings,
	Repository,
	SetRepositoryFrontmatter
};