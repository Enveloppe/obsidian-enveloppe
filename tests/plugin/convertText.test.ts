import { beforeEach, describe, expect, test } from "@jest/globals";
import settingsFixture from "../fixtures/githubPublisherSettings";
import { GitHubPublisherSettings } from "../../plugin/settings/interface";
import findAndReplaceText from "../../plugin/conversion/findAndReplaceText";

let settings: GitHubPublisherSettings;

const resetFixtures = () => {
	settings = settingsFixture;
};

beforeEach(() => {
	resetFixtures();
});

describe("findAndReplaceText standard behavior", () => {
	test("skips if settings.censorText is empty", () => {
		const initialText = `file v1`;
		const expectedText = `file v1`;

		settings["censorText"] = [];
		const subject = findAndReplaceText(initialText, settings);

		expect(subject).toBe(expectedText);
	});

	test("replaces patterns in a string in sequence", () => {
		const initialText = `file v1`;
		const expectedText = `file v4`;

		settings["censorText"] = [
			{
				entry: "file v1",
				replace: "file v2",
				after: false,
				flags: "gi",
			},
			{
				entry: "file v2",
				replace: "file v3",
				after: false,
				flags: "gi",
			},
			{
				entry: "file v3",
				replace: "file v4",
				after: false,
				flags: "gi",
			},
		];
		const subject = findAndReplaceText(initialText, settings);

		expect(subject).toBe(expectedText);
	});
});

describe("findAndReplaceText with patterns for Jekyll", () => {
	test("replaces strings", () => {
		const initialText = `
			[Alt Text](http://do-not-touch-websites.com)
			[Alt Text](pure-file)
			[Alt Text](directory/and-file)
			[Alt Text](directory/and-file-with-extension.md)
			[Alt Text](./file-with-period)
			[Alt Text](./directory/file-with-period)

			[Alt Text](http://do-not-touch-websites.com)
			[Alt Text](images/do-not-add-link-when-starting-with-image-keyword)
			[Alt Text](/images/do-not-add-link-when-starting-with-image-keyword)
			![Alt Text](/images/do-not-add-link-when-starting-with-image-keyword)
			[Alt Text](obsidian/images/do-not-add-link-when-starting-with-obsidian-image-keyword)

			\`[Alt Text](do-not-touch-code-examples)\`
			\` [Alt Text](touch-code-examples with space)\`
			\` [Alt Text](touch-code-examples with space) \`
			\`[Alt Text]({% link obsidian/touch-code-examples with space.md %})\`
		`;
		const expectedText = `
			[Alt Text](http://do-not-touch-websites.com)
			[Alt Text]({% link obsidian/pure-file.md %})
			[Alt Text]({% link obsidian/directory/and-file.md %})
			[Alt Text]({% link obsidian/directory/and-file-with-extension.md %})
			[Alt Text]({% link obsidian/file-with-period.md %})
			[Alt Text]({% link obsidian/directory/file-with-period.md %})

			[Alt Text](http://do-not-touch-websites.com)
			[Alt Text](/images/do-not-add-link-when-starting-with-image-keyword)
			[Alt Text](/images/do-not-add-link-when-starting-with-image-keyword)
			![Alt Text](/images/do-not-add-link-when-starting-with-image-keyword)
			[Alt Text](/images/do-not-add-link-when-starting-with-obsidian-image-keyword)

			\`[Alt Text](do-not-touch-code-examples)\`
			\` [Alt Text]({% link obsidian/touch-code-examples with space.md %})\`
			\` [Alt Text]({% link obsidian/touch-code-examples with space.md %}) \`
			\`[Alt Text]({% link obsidian/touch-code-examples with space.md %})\`
		`;

		settings["censorText"] = [
			{
				// Converts [a](b) into [a]({% link obsidian/b.md %})
				//
				// Ignore .md extensions, if any.
				// We will add an .md extension later. ----------------------------------------------\
				//                                                                                    |
				// Matches the final destination                                                      |
				// so we can reuse in `replace`. ----------------------------------------------\      |
				//                                                                              |     |
				// Ignores ./ so it's removed.                                                  |     |
				// The * makes sure it's zero                                                   |     |
				// or more ./   ---------------------------------------------------------\      |     |
				//                                                                        |     |     |
				// Skips http and image paths.                                            |     |     |
				// ?! stands for negative                                                 |     |     |
				// lookahead. If `http` is                                                |     |     |
				// found, halts process. -------------\                                   |     |     |
				//                                     |                                  |     |     |
				// Starts link                         |                                  |     |     |
				// destination. -------------------\   |                                  |     |     |
				//                                 |   |                                  |     |     |
				// The link's Alt  ----------\     |   |                                  |     |     |
				//                            |    |   |                                  |     |     |
				// Skip links within code     |    |   |                                  |     |     |
				// samples. (?<!`) makes      |    |   |                                  |     |     |
				// sure no ` (e.g backtick)   |    |   |                                  |     |     |
				// exists before              |    |   |                                  |     |     |
				// bracket. --------\         |    |   |                                  |     |     |
				//                   |        |    |   |                                  |     |     |
				//                   V        V    V   V                                  V     V     V
				entry: String.raw`(?<!\`)\[(.*?)\]\((?!(http|\/*image|obsidian\/image))(\.\/)*(.+?)(\.md)*\)`,
				replace: "[$1]({% link obsidian/$4.md %})",
				after: false,
				flags: "gi",
			},
			{
				// Converts [a](obsidian/images/b) into [a](/images/b)
				//
				// Everything else. -------------------------------------\
				//                                                        |
				// Ignores `obsidian/` prefix if any. -\                  |
				//                                      |                 |
				// Starts link                          |                 |
				// destination. --------------------\   |                 |
				//                                  |   |                 |
				// The link's Alt  ----------\      |   |                 |
				//                            |     |   |                 |
				// Skip images within code.   |     |   |                 |
				// (?<!`) makes sure no       |     |   |                 |
				// backtick exists before     |     |   |                 |
				// bracket. --------\         |     |   |                 |
				//                   |        |     |   |                 |
				//                   V        V     V   V                 V
				entry: String.raw`(?<!\`)\[(.*?)\]\(((obsidian\/)?image)(.+)\)`,
				replace: "[$1](/image$4)",
				after: false,
				flags: "gi"
			},
		];
		const subject = findAndReplaceText(initialText, settings);

		expect(subject).toBe(expectedText);
	});
});
