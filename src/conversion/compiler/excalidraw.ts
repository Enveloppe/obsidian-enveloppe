import type { App, TFile } from "obsidian";
import type { ExcalidrawAutomate } from "../../@types/ExcalidrawAutomate";

/**
 * @param file
 * @param app
 */
export async function convertToHTMLSVG(file: TFile, app: App) {
	try {
		const excalidraw = app.plugins.getPlugin("obsidian-excalidraw-plugin");
		if (!excalidraw) return null;
		// @ts-ignore
		const ea = excalidraw.ea as ExcalidrawAutomate;
		const settings = ea.getExportSettings(false, true);
		const embeddedFilesLoader = ea.getEmbeddedFilesLoader(true);
		const svg = await ea.createSVG(file.path, true, settings, embeddedFilesLoader);
		return svg.outerHTML as string;
	} catch (e) {
		console.error(e);
		return null;
	}
}
