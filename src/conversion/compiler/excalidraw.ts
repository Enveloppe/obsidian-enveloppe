import type { App, TFile } from "obsidian";

export async function convertToHTMLSVG(file: TFile, app: App) {
	try {
		const excalidraw = app.plugins.getPlugin("obsidian-excalidraw-plugin");
		if (!excalidraw) return null;
		// @ts-ignore
		const ea = excalidraw.ea;
		const svg = await ea.createSVG(file.path, ea.getExportSettings(true, true));
		return svg.outerHTML as string;
	} catch (e) {
		console.error(e);
		return null;
	}
}
