import type { App, Plugin, TFile } from "obsidian";
import type { ExcalidrawAutomate } from "../../@types/excalidraw-automate";

interface ExcalidrawPlugin extends Plugin {
	ea: ExcalidrawAutomate;
}

/**
 * @param file
 * @param app
 */
export async function convertToHTMLSVG(file: TFile, app: App) {
	try {
		const excalidraw = app.plugins.getPlugin(
			"obsidian-excalidraw-plugin"
		) as ExcalidrawPlugin | null;
		if (!excalidraw) return null;
		const ea = excalidraw.ea;
		const settings = ea.getExportSettings(false, true);
		const embeddedFilesLoader = ea.getEmbeddedFilesLoader(true);
		const svg = await ea.createSVG(file.path, true, settings, embeddedFilesLoader);
		return svg.outerHTML;
	} catch (e) {
		console.error(e);
		return null;
	}
}
