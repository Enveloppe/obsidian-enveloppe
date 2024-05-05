import { FrontMatterCache } from "obsidian";

import GithubPublisher from "../main";
import { FrontmatterConvert, RepoFrontmatter, Repository } from "./main";

export interface MultiProperties {
	plugin: GithubPublisher;
	frontmatter: {
		general: FrontmatterConvert;
		repo: RepoFrontmatter | RepoFrontmatter[];
	},
	repository: Repository | null;
	filepath: string;
}

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

export interface MonoRepoProperties {
	frontmatter: RepoFrontmatter;
	repo: Repository | null;
	convert: FrontmatterConvert;
}

export interface MultiRepoProperties {
	frontmatter: RepoFrontmatter[] | RepoFrontmatter;
	repo: Repository | null;

}