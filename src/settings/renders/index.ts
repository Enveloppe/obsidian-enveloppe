import type { EnveloppeSettings } from "@interfaces";
import i18next from "i18next";
import {
	type App,
	Component,
	MarkdownRenderer,
	type Setting,
	type SettingDefinition,
	type SettingDefinitionList,
	type SettingDefinitionPage,
	type TextComponent,
} from "obsidian";
import type EnveloppePlugin from "src/main";

/**
 * Builds a `type: "list"` for a plain array of strings (extensions, folder names,
 * tag names…) — one row per entry, each with its own editable text field, add and
 * delete affordances. Replaces the older pattern of splitting a single
 * comma/newline-separated textarea into an array.
 *
 * A list is only valid at the top level of a page's `items` (a group's `items` accept
 * settings and pages only), so it always renders outside the tab's own `containerEl`
 * and has to re-declare the `enveloppe` CSS scope itself. Prefer {@link stringListPage}
 * over calling this directly.
 */
export function stringListItems(
	ctx: RenderContext,
	options: {
		heading?: string;
		emptyState?: string;
		addItemName: string;
		placeholder?: string;
		values: string[];
		/** A rejected value is flagged and not saved */
		validate?: (value: string) => boolean;
		save: () => Promise<void> | void;
		visible?: boolean | (() => boolean);
	}
): SettingDefinitionList {
	const { values } = options;
	return {
		type: "list",
		cls: "enveloppe",
		heading: options.heading,
		emptyState: options.emptyState,
		visible: options.visible,
		addItem: {
			name: options.addItemName,
			action: () => {
				void (async () => {
					values.push("");
					await options.save();
					ctx.update();
				})();
			},
		},
		onReorder: (oldIndex, newIndex) => {
			void (async () => {
				const [moved] = values.splice(oldIndex, 1);
				values.splice(newIndex, 0, moved);
				await options.save();
				// Obsidian documents `onReorder` as needing no rebuild, but a drag only moves
				// the DOM node: `SettingGroup.settings` keeps its pre-drag order, and the
				// delete button resolves its index through that array, so it would delete the
				// wrong entry. Rebuilding also refreshes the indices each row writes back to.
				ctx.update();
			})();
		},
		onDelete: (index) => {
			void (async () => {
				values.splice(index, 1);
				await options.save();
				ctx.update();
			})();
		},
		// Read `values[index]` inside `render` rather than capturing the string from
		// `map`: definitions are built once per `update()` and replayed on every
		// re-render (navigating back into the page, for one), so a captured string
		// would resurrect the value the entry had when the definitions were last
		// built and wipe out anything typed since. The other lists get this for free
		// by holding an object reference, but strings are copied.
		items: values.map((_, index) => ({
			name: "",
			searchable: false,
			render: (setting) => {
				setting.setClass("no-display").addText((text) => {
					text
						.setPlaceholder(options.placeholder ?? "")
						.setValue(values[index])
						.onChange(async (v) => {
							const valid = options.validate?.(v) ?? true;
							text.inputEl.toggleClass("error", !valid);
							if (!valid) return;
							values[index] = v;
							await options.save();
						});
				});
			},
		})),
	};
}

/**
 * Wraps a {@link stringListItems} list in its own navigable page, the way the regex
 * lists in `pages.ts` are built.
 *
 * A list carries a `heading` but never a `desc`, so an inline list needs an inert
 * setting row above it just to show its description — and then the title is rendered
 * twice. A page entry carries both `name` and `desc`, so the list inside it needs no
 * heading at all. Being a page also means it stays a valid `SettingGroupItem`, i.e. it
 * can sit inside a `type: "group"` where a bare list cannot.
 */
export function stringListPage(
	ctx: RenderContext,
	options: {
		name: string;
		desc?: string | DocumentFragment;
		emptyState?: string;
		addItemName: string;
		placeholder?: string;
		values: string[];
		/** A rejected value is flagged and not saved */
		validate?: (value: string) => boolean;
		save: () => Promise<void> | void;
		visible?: boolean | (() => boolean);
	}
): SettingDefinitionPage {
	return {
		type: "page",
		name: options.name,
		desc: options.desc,
		visible: options.visible,
		items: [
			// The page is already named after this list, so it carries no heading.
			stringListItems(ctx, {
				emptyState: options.emptyState,
				addItemName: options.addItemName,
				placeholder: options.placeholder,
				values: options.values,
				validate: options.validate,
				save: options.save,
			}),
		],
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

/** The list of regexes applied on the copied links */
export function linkRegexList(
	ctx: RenderContext,
	values: { regex: string; replacement: string }[],
	visible: () => boolean
): SettingDefinitionList {
	const save = () => ctx.plugin.saveSettings();
	return {
		type: "list",
		cls: "enveloppe",
		heading: i18next.t("settings.plugin.copyLink.applyRegex.title"),
		visible,
		emptyState: i18next.t("settings.plugin.copyLink.applyRegex.desc"),
		addItem: {
			name: i18next.t("settings.plugin.copyLink.applyRegex.title"),
			action: () => {
				void (async () => {
					values.push({ regex: "", replacement: "" });
					await save();
					ctx.update();
				})();
			},
		},
		onReorder: (oldIndex, newIndex) => {
			void (async () => {
				const [moved] = values.splice(oldIndex, 1);
				values.splice(newIndex, 0, moved);
				await save();
				// Required despite the docs saying otherwise — see `stringListItems`.
				ctx.update();
			})();
		},
		onDelete: (index) => {
			void (async () => {
				values.splice(index, 1);
				await save();
				ctx.update();
			})();
		},
		items: values.map((apply) => ({
			name: "",
			searchable: false,
			render: (setting) => {
				setting
					.setClass("no-display")
					.addText((text) => {
						widenInput(text)
							.setPlaceholder(i18next.t("common.regex"))
							.setValue(apply.regex)
							.onChange(async (value) => {
								apply.regex = value;
								await save();
							});
					})
					.addText((text) => {
						widenInput(text)
							.setPlaceholder(i18next.t("regex.replace"))
							.setValue(apply.replacement)
							.onChange(async (value) => {
								apply.replacement = value;
								await save();
							});
					});
			},
		})),
	};
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
