---
title: Développement
---

## Développement

### Général

Vous pouvez m'aider à développer le plugin en utilisant `npm` !
1. Tout d'abord, clonez le projet sur votre ordinateur avec `git clone git@github.com:obsidianPublisher/obsidian-github-publisher.git`.
2. `cd obsidian-github-publisher`.
3. `npm install`

Quelque notes :
- J'utilise les [Conventional Commit](https://www.conventionalcommits.org/en/v1.0.0/) pour générer le changelog, donc merci de respectez les spécifications !
- De documenter les fonctions que vous créez. 

### Traduction

En utilisant [i18n](https://www.i18next.com/), vous pouvez traduire le plugin. 

Pour ajouter un nouveau langage :
- Clonez le fichier `i18n/locales/en-us.ts` et renommez-le dans votre langue.
- Obtenez votre langue locale depuis Obsidian en utilisant [obsidian translation](https://github.com/obsidianmd/obsidian-translations) ou en utilisant les commandes (dans templater par exemple) : `<% tp.obsidian.moment.locale() %>` 
- Traduisez le fichier et enregistrez-le.
- Dans `i18n/index.ts` :
  - Importez le nouveau fichier comme `import language from '.locales/language'`.
  - ajoutez la nouvelle langue dans l'objet json `localeMap` : `{ "language" : language }`
- De plus, vous pouvez tester si votre traduction est correcte.
- Créez un PR pour ajouter votre traduction !
