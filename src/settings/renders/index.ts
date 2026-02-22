import type { EnveloppeSettings, ESettingsTabId } from "@interfaces";
import type { App } from "obsidian";
import type EnveloppePlugin from "src/main";

export interface RenderContext {
	app: App;
	plugin: EnveloppePlugin;
	settings: EnveloppeSettings;
	settingsPage: HTMLElement;
	branchName: string;
	renderSettingsPage: (tabId: string | ESettingsTabId) => Promise<void>;
	copy: (object: any) => any;
}

export const splitByCommaOrNewLine = (value: string): string[] => {
	return value
		.split(/[,\n]/)
		.map((item) => item.trim())
		.filter((item) => item.length > 0);
};

export const splitByCommaOrNewLineAndNonWord = (value: string): string[] => {
	return value
		.split(/[,\n]\W*/)
		.map((item) => item.trim())
		.filter((item) => item.length > 0);
};

export const splitByCommaOrNewLineAndSpaces = (value: string): string[] => {
	return value
		.split(/[,\n]\s*/)
		.map((item) => item.trim())
		.filter((item) => item.length > 0);
};
