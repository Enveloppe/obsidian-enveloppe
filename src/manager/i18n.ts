import { translationLanguage } from "src/i18n/i18next";

// Strings of the file manager. They live here until they are added to the locales repository.
const en = {
	title: "Enveloppe",
	repository: "Repository",
	command: "Open the published files manager",
	commandTab: "Open the published files manager in a tab",
	location: {
		title: "Published files manager",
		desc: "Where the command and the ribbon icon open the manager. The menu of the manager can also move it.",
		tab: "In a tab",
		left: "In the left sidebar",
		right: "In the right sidebar",
		move: "Move the manager",
		menu: {
			tab: "Open in a tab",
			left: "Move to the left sidebar",
			right: "Move to the right sidebar",
		},
	},
	dryRun: "Dry-run",
	tabs: { files: "Files", activity: "Activity" },
	actions: {
		scan: "Scan the repository",
		check: "Look for notes edited since their publication",
		cancel: "Cancel",
		refresh: "Refresh",
		publish: "Publish",
		republish: "Publish again",
		delete: "Delete from the repository",
		openNote: "Open the note",
		openRemote: "Open in the repository",
		clearSelection: "Clear the selection",
		selectAll: "Select all the visible files",
		showMore: "Show {{count}} more",
		clearActivity: "Clear finished entries",
	},
	status: {
		all: "All",
		published: "Published",
		modified: "Modified",
		unpublished: "Not published",
		orphan: "Orphan",
	},
	statusHelp: {
		published: "The file is in the repository",
		modified: "The note was edited after its last publication",
		unpublished: "The note is shared but not yet in the repository",
		orphan: "The file is in the repository but no shared note produces it anymore",
	},
	badges: {
		pr: "PR",
		prHelp: "Changed in a pull request that is not merged yet",
		index: "Index",
		indexHelp: "Folder note: the automatic cleaning keeps it depending on its properties",
		attachment: "Attachment",
	},
	search: "Filter by path…",
	selected: "{{count}} selected",
	empty: {
		never: "Scan the repository to compare it with your shared notes.",
		none: "No file matches.",
		scanning: "Scanning…",
	},
	stale: "Changes since the last scan.",
	scannedAt: "Scanned at {{time}}",
	checking: "Checking {{done}}/{{total}}",
	confirm: {
		deleteTitle: "Delete {{count}} file(s) from {{repo}}?",
		deleteDesc:
			"A branch is created and the deletion goes through a pull request, like any publication.",
		deleteDryRun: "The files are moved to the trash of the vault.",
		stillShared:
			"{{count}} note(s) are still shared: they will come back with the next publication of all notes.",
		more: "…and {{count}} more",
		publishTitle: "Publish {{count}} note(s) to {{repo}}?",
		confirm: "Confirm",
		cancel: "Cancel",
	},
	activity: {
		operations: "Operations",
		log: "Live log",
		emptyLog: "Nothing published since Obsidian started.",
		kinds: {
			publish: "Publication",
			delete: "Deletion",
			check: "Check",
		},
		push: "Upload",
		remove: "Deletion",
		skipped: "Up to date, or not shared to this repository",
		notFound: "Not found in the repository",
		progress: "{{done}}/{{total}}",
	},
	notices: { deleted: "{{count}} file(s) deleted" },
	errors: { noToken: "No GitHub token is configured for this repository." },
};

type Dictionary = typeof en;
type DeepPartial<T> = {
	[K in keyof T]?: T[K] extends string ? string : DeepPartial<T[K]>;
};

const fr: DeepPartial<Dictionary> = {
	repository: "Dépôt",
	command: "Ouvrir le gestionnaire des fichiers publiés",
	commandTab: "Ouvrir le gestionnaire des fichiers publiés dans un onglet",
	location: {
		title: "Gestionnaire des fichiers publiés",
		desc: "Où la commande et l'icône du ruban ouvrent le gestionnaire. Son menu permet aussi de le déplacer.",
		tab: "Dans un onglet",
		left: "Dans la barre latérale gauche",
		right: "Dans la barre latérale droite",
		move: "Déplacer le gestionnaire",
		menu: {
			tab: "Ouvrir dans un onglet",
			left: "Déplacer dans la barre latérale gauche",
			right: "Déplacer dans la barre latérale droite",
		},
	},
	dryRun: "Test à blanc",
	tabs: { files: "Fichiers", activity: "Activité" },
	actions: {
		scan: "Analyser le dépôt",
		check: "Chercher les notes modifiées depuis leur publication",
		cancel: "Annuler",
		refresh: "Actualiser",
		publish: "Publier",
		republish: "Publier à nouveau",
		delete: "Supprimer du dépôt",
		openNote: "Ouvrir la note",
		openRemote: "Ouvrir dans le dépôt",
		clearSelection: "Vider la sélection",
		selectAll: "Sélectionner tous les fichiers visibles",
		showMore: "Afficher {{count}} de plus",
		clearActivity: "Effacer les entrées terminées",
	},
	status: {
		all: "Tous",
		published: "Publié",
		modified: "Modifié",
		unpublished: "Non publié",
		orphan: "Orphelin",
	},
	statusHelp: {
		published: "Le fichier est dans le dépôt",
		modified: "La note a été modifiée après sa dernière publication",
		unpublished: "La note est partagée mais pas encore dans le dépôt",
		orphan: "Le fichier est dans le dépôt mais plus aucune note partagée ne le produit",
	},
	badges: {
		pr: "PR",
		prHelp: "Modifié dans une pull request pas encore fusionnée",
		index: "Index",
		indexHelp:
			"Note de dossier : le nettoyage automatique la conserve selon ses propriétés",
		attachment: "Pièce jointe",
	},
	search: "Filtrer par chemin…",
	selected: "{{count}} sélectionné(s)",
	empty: {
		never: "Analysez le dépôt pour le comparer à vos notes partagées.",
		none: "Aucun fichier ne correspond.",
		scanning: "Analyse en cours…",
	},
	stale: "Des changements ont eu lieu depuis la dernière analyse.",
	scannedAt: "Analysé à {{time}}",
	checking: "Vérification {{done}}/{{total}}",
	confirm: {
		deleteTitle: "Supprimer {{count}} fichier(s) de {{repo}} ?",
		deleteDesc:
			"Une branche est créée et la suppression passe par une pull request, comme une publication.",
		deleteDryRun: "Les fichiers sont déplacés dans la corbeille du coffre.",
		stillShared:
			"{{count}} note(s) sont encore partagées : elles reviendront à la prochaine publication de toutes les notes.",
		more: "…et {{count}} de plus",
		publishTitle: "Publier {{count}} note(s) vers {{repo}} ?",
		confirm: "Confirmer",
		cancel: "Annuler",
	},
	activity: {
		operations: "Opérations",
		log: "Journal en direct",
		emptyLog: "Rien n'a été publié depuis le démarrage d'Obsidian.",
		kinds: {
			publish: "Publication",
			delete: "Suppression",
			check: "Vérification",
		},
		push: "Envoi",
		remove: "Suppression",
		skipped: "À jour, ou non partagée vers ce dépôt",
		notFound: "Introuvable dans le dépôt",
	},
	notices: { deleted: "{{count}} fichier(s) supprimé(s)" },
	errors: { noToken: "Aucun jeton GitHub n'est configuré pour ce dépôt." },
};

const dictionaries: Record<string, DeepPartial<Dictionary>> = { fr };

function lookup(dictionary: unknown, key: string): string | undefined {
	let value = dictionary;
	for (const part of key.split(".")) {
		if (typeof value !== "object" || value === null) return undefined;
		value = (value as Record<string, unknown>)[part];
	}
	return typeof value === "string" ? value : undefined;
}

export function t(key: string, vars: Record<string, string | number> = {}): string {
	const text = lookup(dictionaries[translationLanguage], key) ?? lookup(en, key) ?? key;
	return text.replace(/{{(\w+)}}/g, (_, name: string) => String(vars[name] ?? ""));
}
