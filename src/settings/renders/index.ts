import type { EnveloppeSettings } from "@interfaces";
import {
	type App,
	Component,
	MarkdownRenderer,
	type Setting,
	type SettingDefinition,
	type TextAreaComponent,
	type TextComponent,
} from "obsidian";
import type EnveloppePlugin from "src/main";

/**
 * Force a textarea to be wide instead of the browser's tiny default. Set inline
 * (not via a CSS class) for the same reason as `prepareRawRow`: nested pages
 * aren't reliably reachable by class selectors scoped under "enveloppe".
 */
export function widenTextarea(
	text: TextAreaComponent,
	height = "160px"
): TextAreaComponent {
	Object.assign(text.inputEl.style, { width: "100%", height, flex: "1 1 auto" });
	return text;
}

/**
 * Let a text input actually grow inside a multi-field list row instead of
 * shrinking to its default size. Inline for the same reason as `widenTextarea`.
 */
export function widenInput(text: TextComponent): TextComponent {
	Object.assign(text.inputEl.style, { width: "100%", flex: "1 1 auto" });
	return text;
}

/**
 * Strip a Setting row down to plain flowing content: drop the name/desc column
 * entirely and render into the control column, which is the element the
 * framework actually keeps around (unlike settingEl, whose two-column layout is
 * re-applied around whatever it contains).
 *
 * Styles are set inline rather than via a CSS class: nested declarative pages
 * don't reliably render underneath the containerEl the "enveloppe" class is
 * applied to, so class-based selectors silently fail to match there. Inline
 * styles work regardless of which ancestor (if any) carries that class.
 */
function prepareRawRow(setting: Setting): HTMLElement {
	setting.settingEl.addClass("enveloppe-raw-content");
	Object.assign(setting.settingEl.style, {
		border: "0",
		padding: "0",
		margin: "0",
		minHeight: "0",
		background: "none",
		boxShadow: "none",
		gridTemplateColumns: "unset",
		gridColumn: "1 / -1",
	});
	setting.infoEl.remove();
	setting.controlEl.empty();
	Object.assign(setting.controlEl.style, {
		display: "block",
		textAlign: "initial",
		width: "100%",
		flex: "auto",
		columns: "initial",
		gridColumn: "1 / -1",
	});
	return setting.controlEl;
}

/**
 * A setting-definition row that renders arbitrary content (headings, paragraphs of
 * HTML) instead of a name/desc/control row. Used for the static prose that the old
 * imperative tabs appended directly to the container.
 */
export const rawContent = (build: (el: HTMLElement) => void): SettingDefinition => ({
	name: "",
	searchable: false,
	render: (setting) => {
		build(prepareRawRow(setting));
	},
});

/**
 * A setting-definition row that renders a Markdown string through Obsidian's own
 * renderer, so prose gets the app's real markdown styling (lists, code, links…)
 * instead of hand-rolled HTML.
 */
export const markdownContent = (
	ctx: RenderContext,
	markdown: string
): SettingDefinition => ({
	name: "",
	searchable: false,
	render: (setting) => {
		const el = prepareRawRow(setting);
		const component = new Component();
		component.load();
		void MarkdownRenderer.render(ctx.app, markdown, el, "", component);
		return () => component.unload();
	},
});

export interface RenderContext {
	app: App;
	plugin: EnveloppePlugin;
	settings: EnveloppeSettings;
	branchName: string;
	copy: <T>(object: T) => T | undefined;
	/** Re-evaluate `visible`/`disabled` predicates without rebuilding the page. */
	refresh: () => void;
	/** Rebuild the page's setting definitions (item added/removed). */
	update: () => void;
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
