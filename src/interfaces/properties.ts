import { FrontMatterCache } from "obsidian";

import GithubPublisher from "../main";
import { FrontmatterConvert, RepoFrontmatter, Repository } from "./main";

/**
 * @interface MultiProperties
 * @description Interface for the properties of a multiple {@link RepoFrontmatter} int the frontmatter
 * Allow to know the plugin, the frontmatter, the repository and the filepath
 */
export interface MultiProperties {
	plugin: GithubPublisher;
	frontmatter: {
		general: FrontmatterConvert;
		repo: RepoFrontmatter | RepoFrontmatter[];
	},
	repository: Repository | null;
	filepath: string;
}

/**
 * @interface MonoProperties
 * Same as {@link MultiProperties} but for a single {@link RepoFrontmatter}
 */
export interface MonoProperties {
	plugin: GithubPublisher;
	frontmatter: {
		general: FrontmatterConvert;
		repo: RepoFrontmatter;
		source: FrontMatterCache | null | undefined;
	},
	repository: Repository | null;
	filepath: string;

}

/**
 * @interface MonoRepoProperties
 * A resume of {@link MonoProperties} and {@link MultiProperties} for a single repoFrontmatter
 */
export interface MonoRepoProperties {
	frontmatter: RepoFrontmatter;
	repo: Repository | null;
	convert: FrontmatterConvert;
}

/**
 * @interface MultiRepoProperties
 * A resume of {@link MonoProperties} and {@link MultiProperties} for multiple repoFrontmatter
 */
export interface MultiRepoProperties {
	frontmatter: RepoFrontmatter[] | RepoFrontmatter;
	repo: Repository | null;
}