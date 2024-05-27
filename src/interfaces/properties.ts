import type { FrontMatterCache } from "obsidian";
import type { Properties, PropertiesConversion, Repository } from "src/interfaces/main";
import type Enveloppe from "src/main";

/**
 * @interface MultiProperties
 * @description Interface for the properties of a multiple {@link Properties} int the frontmatter
 * Allow to know the plugin, the frontmatter, the repository and the filepath
 */
export interface MultiProperties {
	plugin: Enveloppe;
	frontmatter: {
		general: PropertiesConversion;
		prop: Properties | Properties[];
	};
	repository: Repository | null;
	filepath: string;
}

/**
 * @interface MonoProperties
 * Same as {@link MultiProperties} but for a single {@link Properties}
 */
export interface MonoProperties {
	plugin: Enveloppe;
	frontmatter: {
		general: PropertiesConversion;
		prop: Properties;
		source: FrontMatterCache | null | undefined;
	};
	repository: Repository | null;
	filepath: string;
}

/**
 * @interface MonoRepoProperties
 * A resume of {@link MonoProperties} and {@link MultiProperties} for a single properties
 */
export interface MonoRepoProperties {
	frontmatter: Properties;
	repository: Repository | null;
	convert: PropertiesConversion;
}

/**
 * @interface MultiRepoProperties
 * A resume of {@link MonoProperties} and {@link MultiProperties} for multiple properties
 */
export interface MultiRepoProperties {
	frontmatter: Properties[] | Properties;
	repository: Repository | null;
}
