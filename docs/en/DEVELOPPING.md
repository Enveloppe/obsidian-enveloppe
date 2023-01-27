---
title: Developping
---

## General

You can help me to develop the plugin using `npm` !

1. First clone the project on your computer with `git clone git@github.com:obsidianPublisher/obsidian-github-publisher.git`
2. `cd obsidian-github-publisher`
3. `npm install`
4. Enjoy!

Some notes:

- I use [Conventional Commit](https://www.conventionalcommits.org/en/v1.0.0/) to generate the commit message, so please respect the format!
- To forget to documents your function!

## Translation

Using [i18n](https://www.i18next.com/), you can translate the plugin.

To add a new language :

- Clone the `i18n/locales/en.ts` and rename it to your langage.
- Get your locale language from Obsidian using [obsidian translation](https://github.com/obsidianmd/obsidian-translations) or using the commands (in templater for example) : `<% tp.obsidian.moment.locale() %>`
- Translate the file and save it.
- In `i18n/index.ts` :
  - Import the new file as `import language from '.locales/language'`
  - add the new language in the `localeMap` json object: `{ "language": language }`
- Additionnaly, you can test if your translation is okay.
- Create a PR to add your translation!