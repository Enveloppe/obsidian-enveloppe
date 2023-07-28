module.exports = {
	"env": {
		"browser": true,
		"es2022": true,
		"node": true
	},
	"extends": [
		"eslint:recommended",
		"plugin:@typescript-eslint/recommended",
		"plugin:jsonc/recommended-with-jsonc",
		"plugin:jsonc/recommended-with-json",

	],
	"parser": "@typescript-eslint/parser",
	overrides: [
		{
			files: ["*.json"],
			parser: "jsonc-eslint-parser"
		},
	],
	"parserOptions": {
		"ecmaVersion": "latest",
		"sourceType": "module"
	},
	"plugins": [
		"@typescript-eslint",
		"unused-imports",
		"simple-import-sort",
		"import"
	],
	"rules": {
		"indent": [
			"error",
			"tab"
		],
		"linebreak-style": [
			"error",
			"windows"
		],
		"quotes": [
			"error",
			"double"
		],
		"semi": [
			"error",
			"always" 
		],
		"jsonc/sort-keys": [
			"error", 
			"asc", {
				"caseSensitive": false,
				"natural": false
			}
		],
		"@typescript-eslint/ban-ts-comment": "off",
		"unused-imports/no-unused-imports": "error",
		"simple-import-sort/imports": "error",
		"simple-import-sort/exports": "error",
		"import/first": "error",
		"import/newline-after-import": "error",
		"import/no-duplicates": "error"
	}
};
