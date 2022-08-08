---
share: true
title: Obsidian Github Publisher
---

[EN 🇬🇧](https://github.com/obsidianPublisher/obsidian-github-publisher#readme)

<!-- TOC -->

- [Ce que fait le plugin](#ce-que-fait-le-plugin)
- [Configuration](#configuration)
  - [Example de configuration](#example-de-configuration)
  - [GitHub](#github)
  - [Configuration de l'upload](#configuration-de-lupload)
    - [Dossiers de réceptions](#dossiers-de-réceptions)
      - [Bloc de métadonnées](#bloc-de-métadonnées)
      - [Dossier fixé](#dossier-fixé)
      - [Chemin Obsidian](#chemin-obsidian)
    - [Workflow](#workflow)
      - [Auto-nettoyage](#auto-nettoyage)
    - [Conversion des liens](#conversion-des-liens)
      - [Index & folder note](#index--folder-note)
      - [Lien internes](#lien-internes)
      - [Lien Wikilinks vers lien markdown](#lien-wikilinks-vers-lien-markdown)
    - [Transclusion (embed)](#transclusion-embed)
  - [Paramètres du plugin](#paramètres-du-plugin)
- [Développement](#développement)
  - [Général](#général)
  - [Traduction](#traduction)

<!-- /TOC -->

GitHub Publisher est un plugin qui vous aide à envoyer des fichiers dans un dépôt GitHub configuré, en fonction de l'état d'une clé de partage situé dans votre bloc de métadonnée (frontmatter).

Vous pouvez l'utiliser pour envoyer n'importe quel fichier markdown sur GitHub, permettant la compatibilité avec de nombreuses alternatives d'Obsidian Publish. 

Lorsqu'un fichier partagé est trouvé, il sera envoyé dans une nouvelle branche nommée par `votre_nom_du_coffre-mois-jour-année`. Une pull request suivie d'une fusion sera faite, et si tout est correct, la branche sera supprimée après la fusion. 
Ainsi, vous pouvez facilement revenir sur un commit, et créer un workflow basé sur un PR, un PR fusionné, un push spécifique... 

# Ce que fait le plugin

- Lire le frontmatter pour vérifier la valeur d'une clé `share` configurée.
- Envoyer le fichier (et son image intégrée ou ses notes s'il y en a) vers un dépôt GitHub.

Mais le plugin peut faire beaucoup plus !
- Convertir des wikilinks en liens markdown (sans modifier votre fichier)
- Activez une action GitHub qui a un événement `workflow_dispatche`.
- Convertir les liens internes en fonction de la configuration.
- Nettoyer votre repo en supprimant les fichiers supprimés et non partagés
- Renommer le dossier note avec les mêmes stratégies de nom avec `index.md` (+ respecter les paramètres du dossier)
- Partager les fichiers transcluent automatiquement (uniquement s'ils ont la clé de partage)
- Copier un lien vers votre presse-papier !
- Convertir les block `dataview` !

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

### Dossiers de réceptions
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

### Workflow 

Si votre workflow doit activer une action GitHub, définissez le nom ici. 

Laissez-le vide pour désactiver l'activation des actions GitHub.

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


### Conversion des liens

> [!note] Ces paramètres ne modifieront pas le contenu de votre fichier dans votre coffre-fort.

#### Index & folder note

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

Cette option convertira les liens internes (y compris les liens d'image !) du fichier partagé pour correspondre au fichier relatif dans votre dépôt. Seuls les chemins de fichier **existant** et **partagé** seront convertis.
> [!exemple] 
> Fichier cité : `docs/XX/YY/mon_fichier.md`.
> Fichier à convertir : `docs/XX/ZZ/new_file.md`.
> Chemin créé : `../YY/mon_fichier.md`.

#### Lien Wikilinks vers lien markdown

Si vous utilisez des wikilinks quotidiennement mais que votre alternative à Obsidian Publish ne le supporte pas, vous pouvez utiliser ces paramètres pour convertir les wikilink en lien markdown. 

### Transclusion (embed)

Vous pouvez choisir d'envoyer des fichiers transcluent :
- Des images : L'image sera copiée dans le dépôt dans un dossier défini en option ou dans le dossier par défaut.
- Notes : Seuls les fichiers partagés seront copiés dans le dépôt, dans leur dossier respectifs (suivant vos paramètres).

## Paramètres du plugin

Vous pouvez configurer :
- La clé de partage utilisée par le plugin. Par défaut, c'est `share`.
- Les dossiers exclus. La clé de partage ne peut pas fonctionner ici. Utile si vous oubliez de supprimer le `share` (ou de le mettre à `false`) et que vous déplacez un fichier dans votre archive...
- Ajoutez la commande pour partager le fichier dans le menu fichier (clic droit sur un fichier dans l'explorateur ou en utilisant les trois points) et dans le menu éditeur (clic droit sur une note éditée ouverte)
- Ajout de la note de partage du lien dans votre presse-papiers après le partage. Vous pouvez configurer le chemin créé ici, en supprimant certaines parties. Comme il supporte plusieurs parties, vous pouvez séparer les parties en utilisant des virgules. Par exemple, vous pouvez supprimer un dossier `docs/` et l'extension markdown en utilisant : `docs/, .md`.
> [!note] La commande du menu de clic droit peut aussi envoyer le fichier sous votre curseur si c'est un lien ! 

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
  - Importez le nouveau fichier comme `import language from `.locales/language`.
  - ajoutez la nouvelle langue dans l'objet json `localeMap` : `{ "language" : language }`
- De plus, vous pouvez tester si votre traduction est correcte.
- Créez un PR pour ajouter votre traduction !

---

Si vous trouvez ce module et ce workflow utile, vous pouvez m'envoyer de quoi m'acheter du café en grande quantité :
<a href='https://ko-fi.com/X8X54ZYAV' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://cdn.ko-fi.com/cdn/kofi1.png?v=3' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>

[^1]: Seuls les fichiers supportés par Obsidian seront supprimés. 
[^2]: De manière évidente, vous devez être connectés pour pouvoir créer le token. De fait, vous êtes obligés d'avoir un compte github!