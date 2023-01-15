---
title: Commandes
---

Le module ajoute six commandes, dont l'une est aussi appliquée sur le menu du clic droit.

Il y a quatre type de commandes : 
- `Transfert`
- `Rafraîchir`
- `Purge`
- `Test`

## Transfert

Le transfert envoie les fichiers marqués par la clé du frontmatter `share: true` et leur contenu transcluent (ou non, en fonction de vos paramètres) dans le dépôt configuré.

> [!note] « Partagé » signifie ici « qui possède la clé `share: true` dans le frontmatter » 

Il existe : 
- `Transférer la note active` (*aussi présente dans le menu du clic droit*): Envoie seulement la note active. Le dépôt peut ici être configuré via le [[fr/Obsidian/Per files settings|frontmatter]].
- `Transférer toutes les notes` : Envoie toutes les notes partagées dans le dépôt préconfiguré.
-  `Transférer les nouvelles notes` : Envoie uniquement les notes partagées absentes du dépôt.

# Rafraîchir

Rafraîchir va scanner le dépôt et actualiser ou envoyé les notes fondées sur certaines conditions.

- `Rafraîchir toutes les notes publiées` : Il va seulement actualiser le contenu des notes déjà publiées.
	Ici, les dates de commits et la dernière date de mise à jour (issu d'Obsidian) seront comparés.
- `Rafraîchir les notes publiées et transférer les nouvelles notes` : Il transfère les notes absentes du dépôt, mais il va aussi actualiser les notes éditées depuis le dernier push.
	Comme au-dessus, les dates sont comparées.

# Purge

Il n'y a ici qu'une seule commande : `Purger les fichiers dépubliés et supprimés`

> [!note] « Dépublié » signifie ici que la clé `share` a été supprimé ou fixé à `false`

La commande va nettoyer le dépôt préconfiguré, avec la suppression des fichiers que vous avez supprimés ou dont vous avez arrêté le partage.

# Test

Ici aussi, il n'y a qu'une seule commande : `Tester la connexion au dépôt configuré`.

Il va vérifier si le dépôt existe, ainsi que la main branch. Il vérifie aussi que toutes les valeurs ont bien été mise (c'est-à-dire que vous n'avez pas laissé un champ blanc).

