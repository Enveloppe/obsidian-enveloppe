import type { EnveloppeSettings } from "@interfaces";
import {
	type App,
	Component,
	MarkdownRenderer,
	type Setting,
	type SettingDefinition,
	type SettingDefinitionList,
	type TextComponent,
} from "obsidian";
import type EnveloppePlugin from "src/main";

/**
 * Builds a `type: "list"` for a plain array of strings (extensions, folder names,
 * tag names…) — one row per entry, each with its own editable text field, add and
 * delete affordances. Replaces the older pattern of splitting a single
 * comma/newline-separated textarea into an array.
 */
export function stringListItems(
	ctx: RenderContext,
	options: {
		heading: string;
		emptyState?: string;
		addItemName: string;
		placeholder?: string;
		values: string[];
		save: () => Promise<void> | void;
	}
): SettingDefinitionList {
	const { values } = options;
	return {
		type: "list",
		heading: options.heading,
		emptyState: options.emptyState,
		addItem: {
			name: options.addItemName,
			action: () => {
				values.push("");
				void options.save();
				ctx.update();
			},
		},
		onDelete: (index) => {
			values.splice(index, 1);
			void options.save();
			ctx.update();
		},
		items: values.map((value, index) => ({
			name: "",
			searchable: false,
			render: (setting) => {
				setting.setClass("no-display").addText((text) => {
					text
						.setPlaceholder(options.placeholder ?? "")
						.setValue(value)
						.onChange(async (v) => {
							values[index] = v;
							await options.save();
						});
				});
			},
		})),
	};
}

/**
 * Let a text input actually grow inside a multi-field list row instead of
 * shrinking to its default size. Styled via the "enveloppe-wide-input" class
 * in styles.css.
 */
export function widenInput(
	text: TextComponent,
	cls: string = "enveloppe-wide-input"
): TextComponent {
	text.inputEl.addClass(cls);
	return text;
}

/**
 * Strip a Setting row down to plain flowing content: drop the name/desc column
 * entirely and render into the control column, which is the element the
 * framework actually keeps around (unlike settingEl, whose two-column layout is
 * re-applied around whatever it contains). Styled via the "enveloppe-raw-content"
 * and "enveloppe-raw-content-control" classes in styles.css.
 */
function prepareRawRow(setting: Setting): HTMLElement {
	setting.settingEl.addClass("enveloppe-raw-content");
	setting.infoEl.remove();
	setting.controlEl.empty();
	setting.controlEl.addClass("enveloppe-raw-content-control");
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
