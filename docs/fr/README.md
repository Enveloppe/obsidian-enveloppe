# Github Publisher

GitHub Publisher est un module qui vous aide à envoyer des fichiers dans un dépôt GitHub en fonction de l'état d'une clé de métadonnée situé dans votre frontmatter.

Vous pouvez l'utiliser pour envoyer n'importe quel fichier markdown sur GitHub, permettant la compatibilité avec de nombreuses alternatives d'Obsidian Publish (tel que Jekyll, Mkdocs, Hugo ou toute solution s'appuyant sur des fichiers Markdown). 

Lorsqu'un fichier partagé est trouvé, il sera envoyé dans une nouvelle branche nommée par `votre_nom_du_coffre-mois-jour-année`. Une pull request, suivie d'une fusion sera faite, et si tout est correct, la branche sera supprimée après la fusion.

Ainsi, vous pouvez facilement revenir sur un commit, et créer un workflow basé sur un PR, un PR fusionné, un push spécifique... 

## Ce que fait le plugin

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

## Configuration

Pour utiliser le plugin, vous devez remplir les informations correctes afin de pouvoir envoyer des fichiers dans un dépôt GitHub.

### Example de configuration

Vous trouverez [ici](https://obsidian-publisher.netlify.appfr/Obsidian%20Github%20Publisher/configuration%20example/) quelque exemple de configuration possible pour le plugin, comme par exemple Mkdocs Publisher ou [@TuanManhCao Digital Garden](https://github.com/TuanManhCao/digital-garden).

> [!Note] Ajouter des exemples
> Il est tout à fait possible de m'envoyer ou de pull-request de nouvelles configurations pour d'autres alternatives **gratuites** à Obsidian Publish. 

### GitHub 
- Nom du dépôt : Le dépôt dans lequel les fichiers seront envoyés
- Pseudonyme GitHub: Votre pseudonyme.
- Token GitHub :  Obtenez votre [Token GitHub ici](https://github.com/settings/tokens/new?scopes=repo)[^2]. Les paramètres corrects devraient déjà être appliqués. Si vous voulez éviter de générer ce jeton tous les quelques mois, sélectionnez l'option "No expiration". Cliquez sur le bouton "Generate token", et copiez le jeton qui vous est présenté sur la page suivante.
- Nom de la branche : La branche dans laquelle les fichiers seront envoyés. Par défaut, c'est `main`, mais vous pouvez le changer pour ce que vous voulez, tant que la branche existe.
- Vous pouvez désactiver le merging automatique de la pull-request.

Il est possible d'utiliser une configuration par fichier pour changer le nom du dépôt, de l'utilisateur et/ou de la branche. Vous pouvez trouver plus d'information à ce propos [ici](https://obsidian-publisher.netlify.app/obsidian/fr/per%20files%20settings/#changing-repository)

### Configuration de l'upload

Vous pouvez trouver des exemples de chemin de fichier liés à votre configuration dans la section [ici](https://obsidian-publisher.netlify.app/fr/obsidian/filepath_example).

#### Paramètre de chemin d'accès
Vous avez trois possibilités : 
- Utiliser un dossier "fixe" : Chaque fichier sera envoyé dans ce dossier. 
- Utiliser un dossier créé à partir d'une clé `category`.
- Utiliser le chemin relatif depuis obsidian. Vous pouvez préfixer un dossier en utilisant le dossier par défaut. 

Vous devez, dans tous les cas, configurer le **dossier par défaut** : Le fichier sera envoyé ici.
> Si vous utilisez l'option pour frontmatter, ce dossier sera le dossier par défaut : le fichier sera envoyé ici si la clé de catégorie n'existe pas. 

##### Bloc de métadonnées

L'utilisation de la deuxième option activera deux autres options : 
- La clé de catégorie : La clé que vous souhaitez utiliser pour votre dossier.
- Dossier racine : Pour ajouter un chemin d'accès **avant** la clé de catégorie trouvée (si une clé est trouvée !).

##### Dossier fixé
Chaque fichier sera envoyé dans le dossier par défaut. Si vous laissez le dossier par défaut vide, il sera envoyé à la racine du dépôt. 

##### Chemin Obsidian
Il utilise le chemin relatif dans votre coffre-fort Obsidian. Le dossier par défaut sera ajouté avant le chemin relatif d'Obsidian. Vous pouvez le laisser vide pour utiliser la racine de votre dépôt.

La `suppression de chemin` vous permet de supprimer une partie du chemin créé, vers, par exemple, un sous-dossier de synchronisation. Si le chemin supprimé n'est pas trouvé, le comportement normal s'applique.

#### Paramètres de nom de fichier

Vous pouvez choisir de renommer le fichier avant de l'envoyer en utilisant une clé configurée.

#### Workflow

##### Github Actions

Si votre workflow doit activer une action GitHub, définissez le nom ici. 

Laissez-le vide pour désactiver l'activation des actions GitHub. 

> [!note] L'action à activer doit être activé sur un évènement `workflow_dispatche`

##### Metadata Extractor

Il est aussi possible d'envoyer les fichiers générés par le plugin [Metadata Extractor](https://github.com/kometenstaub/metadata-extractor). Si vous le souhaitez, vous devez mettre le chemin du dossier où les fichiers doivent être envoyés. 

> [!warning] Informations
> 1. L'option n'apparaît que si le plugin est installé et activé.
> 2. Cette fonction fonctionne uniquement sur la version bureau d'obsidian (puisque Metadata-Extractor n'est pas disponible sur mobile).
> 3. Seulement les fichiers générés dans `.obsidian/plugins` seront envoyés : le plugin ne supporte pas les fichiers externes. 

##### Auto-nettoyage

Vous pouvez également configurer une "suppression automatique" lorsque vous utilisez les commandes pour supprimer des fichiers :
- Supprimés de votre coffre-fort
- Que vous avez cessé de partager

Cette option ajoutera également une nouvelle commande pour nettoyer les fichiers uniquement.

> [!warning] Attention
> Vous ne pouvez pas utiliser la commande delete si vous n'avez pas défini un dossier par défaut (et un dossier racine si vous utilisez la configuration YAML).
> De plus, vous pouvez perdre certains fichiers en utilisant cette commande, alors faites attention ! N'oubliez pas que vous pouvez revenir en arrière au cas où le plugin supprimerait un fichier que vous ne souhaitez pas supprimer.

> [!warning] Changer les options
> Dans le cas où vous modifier la configuration, les fichiers précédents ne seront pas supprimés et il y aura une erreur dans cette partie du workflow.


Vous pouvez définir le chemin d'accès des dossiers et fichier dont vous voulez éviter la suppression. Séparez les dossiers/fichiers par une virgule.[^1]

> [!info] Les regex sont supportées, mais vous devez les échapper avec des `\` (par exemple, `^regex$` devient `^\regex\$`).

Il est aussi possible d'empêcher la suppression en utilisant, dans le frontmatter :
 - `share: false` sur un fichier **dans** le dépôt (uniquement) ou sans clé de partage.
 - `autoclean: false` dans le fichier de configuration
 - `index: true` 

> [!warning] À propos de l'option `repo`
> - La commande d'auto-nettoyage ne fonctionnera que pour le dépôt défini dans les paramètres.
> - **Mais** l'auto-nettoyage fonctionnera pour le dépôt configuré (dans le fichier) lorsque vous utilisez la commande permettant de partager une seule note.
> - Les pièces-jointes n'ayant pas de frontmatter, ses fichiers seront supprimés soit dans le dépôt défini dans les paramètres, soit dans le dépôt configuré (dans le fichier) si vous utilisez la fonction de partage unique.

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

> [!warning] Cette option ne fonctionne pas avec un dossier fixe.


##### Lien internes

Cette option convertira les liens internes (y compris les liens des pièces-jointes !) du fichier partagé pour correspondre au fichier relatif dans votre dépôt. Seuls les chemins de fichier **existant** et **partagé**, et du même **repo** seront convertis.

L'option suivante permet de justement convertir les liens vers des fichiers qui ne sont pas partagés. Pratique si vous prévoyez déjà de partager un fichier, mais que vous ne l'avez pas encore fait, sans avoir à repasser sur chaque mention.

##### Lien Wikilinks vers lien markdown

Si vous utilisez des wikilinks quotidiennement mais que votre alternative à Obsidian Publish ne le supporte pas, vous pouvez utiliser ces paramètres pour convertir les wikilink en lien markdown. 

### Transclusion (embed)

Vous pouvez choisir d'envoyer des fichiers transcluent :
- Des pièces-jointes : Le fichier sera copiée dans le dépôt dans un dossier défini en option ou dans le dossier par défaut.
- Notes : Seuls les fichiers partagés seront copiés dans le dépôt, dans leur dossier respectifs (suivant vos paramètres).

### Paramètres du plugin

Vous pouvez configurer :
- La clé de partage utilisée par le plugin. Par défaut, c'est `share`.
- Les dossiers exclus. La clé de partage ne peut pas fonctionner ici. Utile si vous oubliez de supprimer le `share` (ou de le mettre à `false`) et que vous déplacez un fichier dans votre archive...
  Les regex sont supportées, mais vous devez les échapper avec des `\`.
- Ajoutez la commande pour partager le fichier dans le menu fichier (clic droit sur un fichier dans l'explorateur ou en utilisant les trois points) et dans le menu éditeur (clic droit sur une note éditée ouverte)
- Ajout de la note de partage du lien dans votre presse-papiers après le partage. Vous pouvez configurer le chemin créé ici, en supprimant certaines parties. Comme il supporte plusieurs parties, vous pouvez séparer les parties en utilisant des virgules. Par exemple, vous pouvez supprimer un dossier `docs/` et l'extension markdown en utilisant : `docs/, .md`.

> [!note] La commande du menu de clic droit peut aussi envoyer le fichier sous votre curseur si c'est un lien ! 

---

> [!info] Il existe de nombreuses options qui peuvent être configurées dans le fichier de configuration YAML. Vous pouvez trouver la liste complète [ici](https://obsidian-publisher.netlify.app/fr/obsidian/per%20files%20settings/#Frontmatter-keys-explanation)


---

# Usage

Le module ajoute sept commandes, dont une est appliquée au menu du clic droit.

- `Transférer la note active`
- `Transférer toutes les notes`
- `Transférer les nouvelles notes`
- `Rafraîchir les notes publiées et transférer les nouvelles notes`
- `Rafraîchir toutes les notes publiées`
- `Purger les fichiers dépubliés et supprimés`
- `Tester la connexion au dépôt configuré`

Toutes les commandes sont décrites [ici](https://github.com/ObsidianPublisher/obsidian-github-publisher/blob/master/docs/fr/COMMANDS.md).

# Developpement

Regardez [ici](https://github.com/ObsidianPublisher/obsidian-github-publisher/blob/master/docs/fr/DEVELOPPING.md) si vous voulez aider au développement du plugin.

---

## Liens utiles

- [La documentation](https://obsidian-publisher.netlify.app/)
- [Le dépôt GitHub](https://github.com/ObsidianPublisher/obsidian-github-publisher)
- [La template Material Mkdocs](https://github.com/ObsidianPublisher/publisher-template-gh-pages)
- [Forum Github](https://github.com/ObsidianPublisher/obsidian-github-publisher/discussions)

---

Si vous trouvez ce module et ce workflow utile, vous pouvez m'envoyer de quoi m'acheter du café en grande quantité :<br>
<a href='https://ko-fi.com/X8X54ZYAV' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://cdn.ko-fi.com/cdn/kofi1.png?v=3' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>

[^1]: Seuls les fichiers supportés par Obsidian seront supprimés. 
[^2]: De manière évidente, vous devez être connectés pour pouvoir créer le token. De fait, vous êtes obligés d'avoir un compte GitHub!
