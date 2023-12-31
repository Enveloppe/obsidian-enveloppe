
import { exportToSvg } from "@excalidraw/utils";
import { TFile, Vault } from "obsidian";

async function getJSONInFile(file: TFile, vault: Vault) {
	const content = await vault.read(file);
	//search ```json and ``` and get the content in between
	const json = content.match(/```json(.|\n)*```/g);
	if (json) {
		return json[0].replace(/```json/g, "").replace(/```/g, "");
	}
	return null;
}

async function getExcalidrawJSON(file: TFile, vault: Vault) {
	const json = await getJSONInFile(file, vault);
	if (json) {
		return JSON.parse(json);
	}
	return null;
}

export async function convertToHTMLSVG(file: TFile, vault: Vault) {
	const json = await getExcalidrawJSON(file, vault);
	if (json) {
		const svg = await exportToSvg(json);
		return svg.outerHTML as string;
	}
	return null;
}