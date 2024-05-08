import { FrontMatterCache } from "obsidian";

import GithubPublisher from "../main";
import { Properties, PropertiesConversion, Repository } from "./main";

/**
 * @interface MultiProperties
 * @description Interface for the properties of a multiple {@link Properties} int the frontmatter
 * Allow to know the plugin, the frontmatter, the repository and the filepath
 */
export interface MultiProperties {
	plugin: GithubPublisher;
	frontmatter: {
		general: PropertiesConversion;
		repo: Properties | Properties[];
	},
	repository: Repository | null;
	filepath: string;
}

/**
 * @interface MonoProperties
 * Same as {@link MultiProperties} but for a single {@link Properties}
 */
export interface MonoProperties {
	plugin: GithubPublisher;
	frontmatter: {
		general: PropertiesConversion;
		repo: Properties;
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
	frontmatter: Properties;
	repo: Repository | null;
	convert: PropertiesConversion;
}

/**
 * @interface MultiRepoProperties
 * A resume of {@link MonoProperties} and {@link MultiProperties} for multiple repoFrontmatter
 */
export interface MultiRepoProperties {
	frontmatter: Properties[] | Properties;
	repo: Repository | null;
}