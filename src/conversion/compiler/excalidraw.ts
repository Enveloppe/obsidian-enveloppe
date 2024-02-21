

import { App,TFile } from "obsidian";


export async function convertToHTMLSVG(file: TFile, app: App) {
	try {
		// @ts-ignore
		const excalidraw = app.plugins.plugins["obsidian-excalidraw-plugin"];
		const ea = excalidraw.ea;
		const svg = await ea.createSVG(file.path, ea.getExportSettings(true, true));
		return svg.outerHTML as string;

	} catch (e) {
		console.error(e);
		return null;
	}
}