---
title: Developping
---

## General

You can help me to develop the plugin using `npm` !

1. First, clone the project on your computer with `git clone git@github.com:obsidianPublisher/obsidian-github-publisher.git`
2. `cd obsidian-github-publisher`
3. `npm install`
4. Enjoy!

Some notes:

- I use [Conventional Commit](https://www.conventionalcommits.org/en/v1.0.0/) to generate the commit message, so please respect the format! 
- Don't forget to document your functions!

## Translation

Using [i18n](https://www.i18next.com/), you can translate the plugin.

To add a new language:

- Clone the `i18n/locales/en.json` and rename it to your language.
- Get your locale language from Obsidian using [obsidian translation](https://github.com/obsidianmd/obsidian-translations) or using the commands (in templater for example) : `<% tp.obsidian.moment.locale() %>`
- Translate the file and save it.
- In `i18n/i18next.ts` :
    - Add `import * as <lang> from "./locales/<lang>.json";`
    - Edit the `ressource` part with adding : `<lang> : {translation: <lang>}`

>[!info] Test locally 
> You can test locally your translation if you want, but you need to clone, have `node`, run `npm i` and run `npm run build`, without forget to add the file `main.js` in your `.obsidian/plugin/obsidian-mkdocs-publisher`. Don't forget to reload Obsidian after the copy!

> [!note] Advice
> If you use VSCode or jetbrain editor, you can look at [i18n Ally](https://i18nally.org) to get some useful tool for your translation!