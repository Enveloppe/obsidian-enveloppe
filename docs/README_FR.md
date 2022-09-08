---
share: true
title: Obsidian Github Publisher
---

[EN 🇬🇧](https://github.com/obsidianPublisher/obsidian-github-publisher#readme)

<!-- TOC -->
- [Ce que fait le plugin](#ce-que-fait-le-plugin)
  - [Ce que ne fait pas le plugin](#ce-que-ne-fait-pas-le-plugin)
- [Configuration](#configuration)
  - [Example de configuration](#example-de-configuration)
  - [GitHub](#github)
  - [Configuration de l'upload](#configuration-de-lupload)
    - [Paramètre de chemin d'accès](#paramètre-de-chemin-daccès)
      - [Bloc de métadonnées](#bloc-de-métadonnées)
      - [Dossier fixé](#dossier-fixé)
      - [Chemin Obsidian](#chemin-obsidian)
    - [Conversion du contenu](#conversion-du-contenu)
      - [Textes](#textes)
      - [Liens](#liens)
        - [Index & folder note](#index--folder-note)
      - [Lien internes](#lien-internes)
      - [Lien Wikilinks vers lien markdown](#lien-wikilinks-vers-lien-markdown)
    - [Transclusion (embed)](#transclusion-embed)
    - [Workflow](#workflow)
      - [Auto-nettoyage](#auto-nettoyage)
  - [Paramètres du plugin](#paramètres-du-plugin)
- [Développement](#développement)
  - [Général](#général)
  - [Traduction](#traduction)
- [Liens utiles](#liens-utiles)
<!-- /TOC -->

GitHub Publisher est un module qui vous aide à envoyer des fichiers dans un dépôt GitHub en fonction de l'état d'une clé de métadonnée situé dans votre frontmatter.

Vous pouvez l'utiliser pour envoyer n'importe quel fichier markdown sur GitHub, permettant la compatibilité avec de nombreuses alternatives d'Obsidian Publish (tel que Jekyll, Mkdocs, Hugo ou toute solution s'appuyant sur des fichiers Markdown). 

Lorsqu'un fichier partagé est trouvé, il sera envoyé dans une nouvelle branche nommée par `votre_nom_du_coffre-mois-jour-année`. Une pull request suivie d'une fusion sera faite, et si tout est correct, la branche sera supprimée après la fusion. 
Ainsi, vous pouvez facilement revenir sur un commit, et créer un workflow basé sur un PR, un PR fusionné, un push spécifique... 

# Ce que fait le plugin

- Lire le frontmatter pour vérifier la valeur d'une clé `share` configurée.
- Envoyer le fichier (et ses pièces-jointes ou ses notes s'il y en a) vers un dépôt GitHub.

Mais le plugin peut faire beaucoup plus !
- Convertir des wikilinks en liens markdown (sans modifier votre fichier)
- Activez une action GitHub qui a un événement `workflow_dispatche`.
- Convertir les liens internes en fonction de la configuration.
- Nettoyer votre repo en supprimant les fichiers supprimés et non partagés
- Renommer le dossier note avec les mêmes stratégies de nom avec `index.md` (+ respecter les paramètres du dossier)
- Partager les fichiers transcluent automatiquement (uniquement s'ils ont la clé de partage)
- Copier un lien vers votre presse-papier !
- Convertir les block `dataview` !
- ✨ Remplacer du texte en utilisant une expression régulière (ou un simple texte) !
- ✨ Envoyer vos inlines tags dans votre bloc de métadonnée (sous la clé `tags`) **et** convertit certaines valeurs de champs en tags. 

## Ce que ne fait pas le plugin

- [ ] Utiliser un dossier local à la place d'un dépôt distant hébergé sur GitHub (voir [dossiers locaux](https://obsidian-publisher.netlify.app/fr/obsidian/local%20folder/))
- [ ] Synchroniser un dépôt git avec votre coffre (Voir [Obsidian Git](https://github.com/denolehov/obsidian-git) / [Obsidian Git Mobile](https://github.com/Vinzent03/obsidian-git-mobile) pour cela)
- [ ] Faire un café 🍵
- [ ] Ramener l'être aimé (le mort)

---

# Configuration

Pour utiliser le plugin, vous devez remplir les informations correctes afin de pouvoir envoyer des fichiers dans un dépôt GitHub.

## Example de configuration

Vous trouverez [ici](https://obsidian-publisher.netlify.appfr/Obsidian%20Github%20Publisher/configuration%20example/) quelque exemple de configuration possible pour le plugin, comme par exemple Mkdocs Publisher ou [@TuanManhCao Digital Garden](https://github.com/TuanManhCao/digital-garden).

> [!Note] Ajouter des exemples
> Il est tout à fait possible de m'envoyer ou de pull-request de nouvelles configurations pour d'autres alternatives **gratuites** à Obsidian Publish. 

## GitHub 
- Nom du dépôt : Le dépôt dans lequel les fichiers seront envoyés
- Pseudonyme GitHub: Votre pseudonyme.
- Token GitHub :  Obtenez votre [Token GitHub ici](https://github.com/settings/tokens/new?scopes=repo)[^2]. Les paramètres corrects devraient déjà être appliqués. Si vous voulez éviter de générer ce jeton tous les quelques mois, sélectionnez l'option "No expiration". Cliquez sur le bouton "Generate token", et copiez le jeton qui vous est présenté sur la page suivante.

## Configuration de l'upload

### Paramètre de chemin d'accès
Vous avez trois possibilités : 
- Utiliser un dossier "fixe" : Chaque fichier sera envoyé dans ce dossier. 
- Utiliser un dossier créé à partir d'une clé `category`.
- Utiliser le chemin relatif depuis obsidian. Vous pouvez préfixer un dossier en utilisant le dossier par défaut. 

Vous devez, dans tous les cas, configurer le **dossier par défaut** :  Le fichier sera envoyé ici.
> Si vous utilisez l'option pour frontmatter, ce dossier sera le dossier par défaut : le fichier sera envoyé ici si la clé de catégorie n'existe pas. 

#### Bloc de métadonnées

L'utilisation de la deuxième option activera deux autres options : 
- La clé de catégorie : La clé que vous souhaitez utiliser pour votre dossier.
- Dossier racine : Pour ajouter un chemin d'accès **avant** la clé de catégorie trouvée (si une clé est trouvée !).

> [!EXAMPLE] Par exemple
> - Vous utilisez `category` dans un fichier avec `category : JDR/Personnages/DND`
> - Vous définissez un dossier racine avec `_docs/pages`.  
> - Vous définissez un dossier par défaut sur `_docs/draft`  
>	  
> Le chemin final (dans GitHub !) sera : `_docs/pages/JDR/Personnages/DND`  
>	  
> Mais, si vous ne mettez pas `category`, le chemin sera `_docs/draft`.  

#### Dossier fixé
Chaque fichier sera envoyé dans le dossier par défaut. Si vous laissez le dossier par défaut vide, il sera envoyé à la racine du dépôt. 

> [!example] Par exemple
> - Si vous définissez `source` pour le dossier par défaut, tout fichier sera envoyé dans `votre_repo/source`, quelque soit sa clé frontmatter ou son chemin relatif.
> - Si vous le laissez vide, il sera envoyé directement dans `votre_repo`.

#### Chemin Obsidian
Il utilise le chemin relatif dans votre coffre-fort Obsidian. Le dossier par défaut sera ajouté avant le chemin relatif d'Obsidian. Vous pouvez le laisser vide pour utiliser la racine de votre dépôt.

> [!example] Par exemple
> Pour un fichier dans `20. Compendium/DND/Créature`
> - Si vous définissez `source` : le chemin final sera `source/20. Compendium/DND/Créature`.
> - Si vous laissez le dossier par défaut vide, le chemin final sera `20. Compendium/DND/Créature`

La `suppression de chemin` vous permet de supprimer une partie du chemin créé, vers, par exemple, un sous-dossier de synchronisation. Si le chemin supprimé n'est pas trouvé, le comportement normal s'applique. 

> [!example] Synchroniser un sous-dossier
> Vous pouvez utiliser cette option pour désigner un sous-dossier comme "coffre-fort" pour la synchronisation du dépôt.
> Vous pourrez utiliser `vault/sub` comme le chemin retiré. L'envoie passera par `vault/sub` comme racine dans le dépôt. 
> Un fichier dans `vault/sub/dossierA` sera envoyé dans `repo/dossierA`.

### Conversion du contenu

> [!note] Ces paramètres ne modifieront pas le contenu de votre fichier dans votre coffre-fort.

#### Textes

Pour certaines raisons, vous pouvez avoir besoin de convertir du texte dans vos fichiers. Ici, vous pouvez configurer :
- Utiliser les sauts de lignes strictes, qui ajout un retour à la ligne "markdown" (double espace) avant chaque saut de ligne.
- La convertion des blocs Dataview simple en markdown. Si cette option est désactivé, le bloc entier sera supprimé du fichier.
- Remplacement de texte : vous pouvez remplacer du texte par un autre en utilisant une simple chaine de caractère/mot ou une expression régulière (Regex).
  - Le texte à remplacer est insensible à la casse.
  - Le remplacement peut être vide pour supprimer la chaine complète.

#### Tags
Cette partie permet de récupérer des valeurs et de les ajouter à vos `tags` dans votre frontmatter.
- <u> Inline tags </u>: Ajoute vos tags inlines dans votre bloc de métadonnée et converti les tags imbriqués en remplaçant le `/` en `_` (par exemple, `#tag/subtag` sera converti en `#tag_subtag`). En bonus, le frontmatter sera converti en YAML standard.
- <u>Conversion de champs dataview/frontmatter en tags</u> : Cela convertira les valeurs associés à un champ dans vos `tags` frontmatter. Vous pouvez aussi empêcher certaines valeurs d'être converti avec le second paramètres.
	*Notes* : Si la valeur est un **lien**, la valeur converti sera le nom du fichier ou le nom affiché. Vous pouvez exclure le nom du fichier ou le nom affiché. 

#### Liens
##### Index & folder note

Certaines solutions de publication prennent en charge les notes de dossier, mais ces notes doivent être nommées `index`. Si vous utilisez [Folder Note](https://github.com/aidenlx/alx-folder-note) avec [les stratégies `same name`](https://github.com/aidenlx/alx-folder-note/wiki/folder-note-pref), vous aurez un problème, non ? Par chance, j'ai une solution pour vous, les gars !

Maintenant, le plugin va convertir ces fichiers en `index` si vous activez les paramètres. Voici quelques exemples de renommage, en utilisant les différents paramètres du dossier par défaut.

> [!exemple] Exemple de frontmatter avec un fichier nommé `folder2`
> - Avec une valeur de catégorie : `dossier1/dossier2` 
> - Avec une valeur racine nommée `docs` ⇒ `docs/folder1/folder2/index.md`
> - Sans valeur racine : `folder1/folder2/index.md` 
> - Sans valeur de catégorie, avec un dossier par défaut nommé `drafts` : `draft/folder2.md` (le nom ne sera pas converti !)

> [!exemple] Exemple avec le chemin Obsidian et un dossier nommé `folder2`
> Avec un chemin comme : `dossier1/dossier2` le nouveau chemin sera :
> - Si vous utilisez un dossier par défaut nommé `docs` : `docs/folder1/folder2/index.md`
> - Sans : `folder1/folder2/index.md`

> [!warning] Cette option ne fonctionne pas avec un dossier fixe.


#### Lien internes

Cette option convertira les liens internes (y compris les liens des pièces-jointes !) du fichier partagé pour correspondre au fichier relatif dans votre dépôt. Seuls les chemins de fichier **existant** et **partagé** seront convertis.
> [!exemple] 
> Fichier cité : `docs/XX/YY/mon_fichier.md`.
> Fichier à convertir : `docs/XX/ZZ/new_file.md`.
> Chemin créé : `../YY/mon_fichier.md`.

#### Lien Wikilinks vers lien markdown

Si vous utilisez des wikilinks quotidiennement mais que votre alternative à Obsidian Publish ne le supporte pas, vous pouvez utiliser ces paramètres pour convertir les wikilink en lien markdown. 

### Transclusion (embed)

Vous pouvez choisir d'envoyer des fichiers transcluent :
- Des pièces-jointes : Le fichier sera copiée dans le dépôt dans un dossier défini en option ou dans le dossier par défaut.
- Notes : Seuls les fichiers partagés seront copiés dans le dépôt, dans leur dossier respectifs (suivant vos paramètres).

### Workflow 

Si votre workflow doit activer une action GitHub, définissez le nom ici. 

Laissez-le vide pour désactiver l'activation des actions GitHub. 

> [!note] L'action à activer doit être activé sur un évènement `workflow_dispatche`

#### Auto-nettoyage

Vous pouvez également configurer une "suppression automatique" lorsque vous utilisez les commandes pour supprimer des fichiers :
- Supprimés de votre coffre-fort
- Que vous avez cessé de partager

Cette option ajoutera également une nouvelle commande pour nettoyer les fichiers uniquement.

> [!warning] Attention
> Vous ne pouvez pas utiliser la commande delete si vous n'avez pas défini un dossier par défaut (et un dossier racine si vous utilisez la configuration YAML).
> De plus, vous pouvez perdre certains fichiers en utilisant cette commande, alors faites attention ! N'oubliez pas que vous pouvez revenir en arrière au cas où le plugin supprimerait un fichier que vous ne souhaitez pas supprimer.

Il est aussi possible d'empêcher la suppression en utilisant, dans le frontmatter :
 - `share: false` sur un fichier **dans** le dépôt (uniquement) ou sans clé de partage.
 - `autoclean: false` dans le fichier de configuration
 - `index: true` 

Vous pouvez définir le chemin d'accès des dossiers et fichier dont vous voulez éviter la suppression. Séparez les dossiers/fichiers par une virgule.[^1]
> [!note] Les regex ne sont pas supportées ici!


## Paramètres du plugin

Vous pouvez configurer :
- La clé de partage utilisée par le plugin. Par défaut, c'est `share`.
- Les dossiers exclus. La clé de partage ne peut pas fonctionner ici. Utile si vous oubliez de supprimer le `share` (ou de le mettre à `false`) et que vous déplacez un fichier dans votre archive...
- Ajoutez la commande pour partager le fichier dans le menu fichier (clic droit sur un fichier dans l'explorateur ou en utilisant les trois points) et dans le menu éditeur (clic droit sur une note éditée ouverte)
- Ajout de la note de partage du lien dans votre presse-papiers après le partage. Vous pouvez configurer le chemin créé ici, en supprimant certaines parties. Comme il supporte plusieurs parties, vous pouvez séparer les parties en utilisant des virgules. Par exemple, vous pouvez supprimer un dossier `docs/` et l'extension markdown en utilisant : `docs/, .md`.
> [!note] La commande du menu de clic droit peut aussi envoyer le fichier sous votre curseur si c'est un lien ! 

---

# Paramètres par fichier

Certains paramètres peuvent être remplacés en fonction de clé écrit dans le frontmatter (du fichier envoyé) :
1. Pour les conversion des liens, en utilisant la clé `links`, vous pouvez créé un objet Yaml avec :
	- `mdlinks` : pour forcer la conversion en lien markdown.
	- `convert` : Pour retirer les liens et en ne gardant que le nom du fichier ou son text alt.
	Noter que vous pouvez utiliser `links: false` et `mdlinks: true` en dehors de l'objet si vous voulez n'utiliser qu'une seule option.
2. Les paramètres des notes transcluent, en utilisant la clé `embed` :
	- `send: false` empêche l'envoie de ses notes (mais pas des pièces-jointes)
	- `remove: true` pour supprimer toute mention de ses notes.
	Comme précédemment, il est possible d'utiliser une seule clé, avec `embed` (pour l'envoie) et `removeEmbed` (pour la suppression des citations)
3. `attachment` pour gérer les pièces-jointes (image, pdf, son, video... Toutes les pièces-jointes supportés par Obsidian)
	- `send: false` empêche l'envoie des pièces-jointes
	- `folder` permet de changer le dossier par défaut. Attention, car ce paramètre peut avoir des effets indésirables si appliqués avec l'autocleaner.
	De nouveau, il est possible d'utiliser un seul paramètre avec `attachmentLinks` pour le dossier et `attachment: false` pour empêcher l'envoie.
4. `dataview` permet de forcer ou empêcher la conversion des queries dataview.
5. `hardbreak` pour le paramètre des sauts de lignes en markdown.

Voyez [ici pour une référence rapide](https://obsidian-publisher.netlify.app/fr/obsidian/per%20files%20settings/)

---

# Développement

## Général

Vous pouvez m'aider à développer le plugin en utilisant `npm` !
1. Tout d'abord, clonez le projet sur votre ordinateur avec `git clone git@github.com:obsidianPublisher/obsidian-github-publisher.git`.
2. `cd obsidian-github-publisher`.
3. `npm install`


Quelque notes :
- J'utilise les [Conventional Commit](https://www.conventionalcommits.org/en/v1.0.0/) pour générer le changelog, donc merci de respectez les spécifications !
- De documenter les fonctions que vous créez. 

## Traduction

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

---
# Liens utiles

- [La documentation](https://obsidian-publisher.netlify.app/)
- [Le dépôt GitHub](https://github.com/ObsidianPublisher/obsidian-github-publisher)
- [La template Material Mkdocs](https://github.com/ObsidianPublisher/obsidian-mkdocs-publisher-template)
- [Le serveur discord](https://discord.gg/8FqxxjxGYx)

---

Si vous trouvez ce module et ce workflow utile, vous pouvez m'envoyer de quoi m'acheter du café en grande quantité :<br>
<a href='https://ko-fi.com/X8X54ZYAV' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://cdn.ko-fi.com/cdn/kofi1.png?v=3' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>

[^1]: Seuls les fichiers supportés par Obsidian seront supprimés. 
[^2]: De manière évidente, vous devez être connectés pour pouvoir créer le token. De fait, vous êtes obligés d'avoir un compte GitHub!