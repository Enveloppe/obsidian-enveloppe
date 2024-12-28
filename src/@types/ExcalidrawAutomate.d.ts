export declare class ExcalidrawAutomate {
	/**
	 *
	 * @param templatePath
	 * @param embedFont
	 * @param exportSettings use ExcalidrawAutomate.getExportSettings(boolean,boolean)
	 * @param loader use ExcalidrawAutomate.getEmbeddedFilesLoader(boolean?)
	 * @param theme
	 * @param padding
	 * @returns
	 */
	createSVG(
		templatePath?: string,
		embedFont?: boolean,
		exportSettings?: ExportSettings,
		loader?: any,
		theme?: string,
		padding?: number
	): Promise<SVGSVGElement>;

	/**
	 * utility function to generate EmbeddedFilesLoader object
	 * @param isDark
	 * @returns
	 */
	getEmbeddedFilesLoader(isDark?: boolean): any;

	/**
	 * utility function to generate ExportSettings object
	 * @param withBackground
	 * @param withTheme
	 * @returns
	 */
	getExportSettings(withBackground: boolean, withTheme: boolean): ExportSettings;
}

interface ExportSettings {
	withBackground: boolean;
	withTheme: boolean;
	isMask: boolean;
	frameRendering?: {
		//optional, overrides relevant appState settings for rendering the frame
		enabled: boolean;
		name: boolean;
		outline: boolean;
		clip: boolean;
	};
	skipInliningFonts?: boolean;
}
