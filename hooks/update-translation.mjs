/**
 * Update the src/i18n/i18next.ts files and adding the new files if any
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

/**
 * Update the locale submodules
 */
const args = process.argv.slice(2)[0];
if (args === "pull") {
	console.log("<> Updating locale submodules <>");
	execSync("cd src/i18n/locales && git checkout main && git pull");
}

const i18nPath = path.resolve("src/i18n/i18next.ts");
const i18nDir = path.resolve("src/i18n/locales");

const i18nFiles = fs
	.readdirSync(i18nDir)
	.filter((file) => file.match(/^..(-..)?\.json$/));

function titleCase(str) {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

let importText = "/** ---- IMPORT TRANSLATIONS ---- */\n";
/**
 * Object that will contain all the translations
 * @Param {Record<string, {translation: string}>} resources
 */
const resources = {};
console.log("<> Parsing i18n files in the src/i18n/locales folder <>");
for (const files of i18nFiles) {
	let locale = files.split(".")[0];
	if (locale.includes("-")) {
		const [language, region] = locale.split("-");
		locale = `${language}${titleCase(region)}`;
	}
	importText += `import ${locale} from './locales/${files}';\n`;
	resources[locale] = { translation: locale };
}
importText += "/** ---- IMPORT TRANSLATIONS ---- */";

// in the i18nPath file, we need to replace the block between /** ---- IMPORT TRANSLATIONS ---- */
// with the new importText
const i18nContent = fs.readFileSync(i18nPath, "utf-8");
let newI18nContent = i18nContent.replace(
	/\/\*\* ---- IMPORT TRANSLATIONS ---- \*\/[\s\S]*\/\*\* ---- IMPORT TRANSLATIONS ---- \*\//,
	importText
);

//edit the block "/** ---- RESOURCE OBJECT ---- */" with the new resources
let resourceObject = `/** ---- RESOURCE OBJECT ---- */\n`;
resourceObject += `export const resources = ${JSON.stringify(resources, null, 2).replaceAll('"', "")} as const;\n`;
resourceObject += `/** ---- RESOURCE OBJECT ---- */`;
newI18nContent = newI18nContent.replace(
	/\/\*\* ---- RESOURCE OBJECT ---- \*\/[\s\S]*\/\*\* ---- RESOURCE OBJECT ---- \*\//,
	resourceObject
);
console.log("<> Updating i18next.ts file <>");
fs.writeFileSync(i18nPath, newI18nContent);
//run biome
console.log("<> Linting i18next.ts file <>");
execSync("biome format src/i18n/i18next.ts --write");
