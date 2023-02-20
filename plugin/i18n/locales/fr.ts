export default {
	commands: {
		shareActiveFile: "Transférer la note active",
		publisherDeleteClean:
			"Purger les fichiers dépubliés et supprimés",
		uploadAllNotes: "Transférer toutes les notes",
		uploadNewNotes: "Transférer les nouvelles notes",
		uploadAllNewEditedNote:
			"Rafraîchir les notes publiées et transférer les nouvelles notes",
		uploadAllEditedNote:
			"Rafraîchir toutes les notes publiées",
		shareViewFiles: (viewFile: string): string =>
			`Transférer "${viewFile}" avec Github Publisher`,
		checkValidity: {
			name: "Tester la connexion au dépôt configuré",
			inRepo: {
				error301: (repoInfo: string): string => `Error 301 : ${repoInfo} a été déplacé de manière permanente.`,
				error404: (repoInfo: string): string => `Error 404 : ${repoInfo}: est introuvable.`,
				error403: (repoInfo: string): string => `Error 403 : Cette action est interdite pour ${repoInfo}.`,
			},
			inBranch: {
				error404: (branchInfo: string[]): string => `Error 404 : La branche ${branchInfo[1]} est introuvable dans ${branchInfo[0]}.`,
				error403: (branchInfo: string[]): string => `Error 301:  ${branchInfo[1]} a été déplacé de manière permanente (depuis ${branchInfo[0]}.`,
			},
			success: (repoInfo: string): string => `${repoInfo} semble valide !`,
		},
	},
	deletion: {
		errorDeleteDefaultFolder:
			"Vous avez besoin d'un dossier par défaut dans les paramètres pour utiliser cette commande.",
		errorDeleteRootFolder:
			"Vous devez configurer un dossier racine dans les paramètres pour utiliser cette commande.",
		successDeleting: (nb: string): string =>
			`Suppression réussie de ${nb} fichiers.`,
		failedDeleting: (nb: string): string =>
			`Échec de la suppression de ${nb} files.`,
		noFileDeleted: "Aucun fichier n'a été supprimé",
	},
	settings: {
		exportSettings: "Exporter les paramètres",
		importSettings: "Importer des paramètres",
		github: {
			apiType: {
				title: "Type d'API",
				desc: "Choisir entre l'API GitHub ou l'API pour GitHub Entreprise (uniquement pour les utilisateurs de GitHub Enterprise — Utilisateur avancé !).",
				hostname: "Instance GitHub Entreprise",
				hostnameDesc: "Le nom de votre instance GitHub Entreprise.",
				dropdown: {
					free: "Free/Pro/Team (défaut)",
					enterprise: "Entreprise",
				}
			},
			githubConfiguration: "Configuration GitHub",
			repoName: "Nom du dépôt",
			repoNameDesc:
				"Le nom du dépôt dans lequel vous enregistrez votre blog.",
			mkdocsTemplate: "mkdocs-template",
			githubUsername: "Nom d'utilisateur GitHub",
			githubUsernameDesc: "Votre nom d'utilisateur GitHub.",
			ghTokenDesc:
				"Un token GitHub avec autorisation de dépôt. Vous pouvez le générer ",
			here: "ici.",
			githubToken: "Token GitHub",
			githubBranchHeading: "Branche principale",
			githubBranchDesc:
				"Si vous utilisez une branche principale différente de main, vous pouvez la spécifier ici.",
			automaticallyMergePR: "Fusionner automatiquement les pull requests",
			testConnection: "Tester la connexion",
		},
		uploadConfig: {
			title: "Configuration du transfert", //désolée du franglais ici mais je trouve pas de traduction propre
			pathSetting: "Paramètres du chemin d'accès",
			folderBehavior: "Comportement du dossier",
			folderBehaviorDesc:
				"Choisissez entre un dossier fixe, la valeur d'une clé de métadonnée ou votre chemin relatif dans Obsidian.",
			fixedFolder: "Dossier fixé",
			yaml: "Clé de métadonnée",
			obsidianPath: "Chemin Obsidian",
			defaultFolder: "Dossier par défaut",
			defaultFolderDesc: "Définir le dossier de réception par défaut.",
			defaultFolderPlaceholder: "docs",
			pathRemoving: "Suppression de chemin",
			pathRemovingDesc:
				"Permettre de publier uniquement le sous-dossier en supprimant le chemin avant celui-ci :",
			pathRemovingPlaceholder: "Blog",
			frontmatterKey: "Clé de métadonnées",
			frontmatterKeyDesc:
				"Définir la clé où obtenir la valeur du dossier.",
			frontmatterKeyPlaceholder: "catégorie",
			rootFolder: "Dossier racine",
			rootFolderDesc:
				"Ajoutez ce chemin au dossier défini par la clé de métadonnées.",

			useFrontmatterTitle: {
				title: "Utiliser une clé de métadonnées pour le titre",
				desc: "Utilisez un champ du frontmatter pour générer le nom du fichier. Par défaut, \"title\" est utilisé.",
			},
			frontmatterRegex: {
				placeholder: "Appliquer un remplacement au titre",
				desc:
					"Si le texte est entre \"//\", il sera interprété comme une expression régulière. Sinon, il sera interprété comme du texte brut.",
			},
		},
		textConversion: {
			textConversion: "Conversion du contenu",
			textConversionDesc:
				"Ces options ne changent pas le contenu du fichier dans votre coffre Obsidian, mais changeront le contenu du fichier publié sur GitHub.",
			textHeader: "Texte",
			hardBreakTitle: "Saut de ligne strict",
			hardBreakDesc:
				"Ajoutez un retour à la ligne Markdown (double espace) après chaque ligne. Ce paramètre peut être outrepassé par la clé de métadonnées \"hardbreak\".",

			links: {
				header: "Liens",
				desc: "Vous pouvez empêcher la conversion des liens et conserver le texte alt (ou le nom du fichier) en utilisant la clé frontmatter \"links\" avec la valeur \"false\".",
				internals: "Liens internes",
				internalsDesc:
					"Convertir le lien interne dans le fichier partagé pour qu'il corresponde aux paramètres du dossier.",
				wikilinks: "Wikilinks",
				wikilinksDesc:
					"Convertir les liens Wikilinks en liens markdown, sans en modifier le contenu. Ce paramètre peut être outrepassé par la clé de métadonnées \"mdlinks\".",
				folderNote: "Folder Note",
				folderNoteDesc:
					"Renommer les fichiers en un nom spécifique (défaut : \"index.md\") s'il porte le même nom que leur dossier/catégorie parent (fonctionne aussi si la note est à l'extérieur du dossier).",
				nonShared:
					"Convertir les liens internes pointant vers des notes non partagées",
				nonSharedDesc:
					"Convertit les liens internes pointant vers un fichier non partagé vers leur homologue dans le site web, avec un chemin relatif. Désactivé, le plugin conservera le nom du fichier.",
			},
			censor: {
				TextHeader: "Replacement de texte",
				TextDesc: "Replacement de texte (ou regex) par un autre texte.",
				TextFlags:
					"Flags (basé sur les regex JS et pouvant être combiné) :",
				flags: {
					insensitive: "i : Insensible à la casse.",
					global: "g : Globale",
					multiline: "m : Multi-ligne",
					dotAll: "s : Dot-all",
					unicode: "u : Unicode",
					sticky: "y : Sticky",
					error: (flag: string): string =>
						`Le flag "${flag}" est invalide.`,
				},
				TextEmpty:
					"Le remplacement de texte peut être vide afin de supprimer le texte.",
				ToolTipAdd: "Ajouter un nouveau remplacement",
				ToolTipRemove: "Supprimer ce remplacement",
				PlaceHolder: "Regex ou text à remplacer",
				ValuePlaceHolder: "Remplacement",
				MomentReplaceRegex: {
					desc: "Choisir le moment où le regex sera exécuté : avant ou après les autres conversions (Dataview, liens internes...)",
					before: "Avant",
					after: "Après"
				}
			},
			dataview: {
				header: "Dataview",
				desc: "Convertir dataview en markdown. Ce paramètre peut être outrepassé par la clé de métadonnées \"dataview\".",
			},
			tags: {
				inlineTagsHeader: "Inlines tags",
				inlineTagsDesc:
					"Ajoute vos tags inline dans votre bloc de métadonnée et convertit les tags imbriqués en remplaçant \"/\" par \"_\".",
				header: "Conversion des champs du frontmatter/dataview en tags",
				desc: "Ceci convertira tous les champs du frontmatter/dataview en tags. Séparez les champs par une virgule.",
				ExcludeHeader: "Exclure des valeurs de la conversion",
				ExcludeDesc:
					"Exclure la valeur de la conversion. Séparez les valeurs par une virgule.",
			},
		},
		embed: {
			embed: "Transclusion",
			transferImage: "Transférer les pièces jointes",
			transferImageDesc:
				"Envoyer les pièces-jointes intégrées dans un fichier dans le dépôt. Ce paramètre peut être outrepassé par la clé de métadonnées \"attachment\".",
			transferEmbeddedNotes: "Transférer les notes transclues",
			transferEmbeddedNotesDesc:
				"Envoyez des notes transcluent dans un fichier partagé dans le dépôt. Seuls les fichiers partagés seront envoyés ! Ce paramètre peut être outrepassé par la clé de métadonnées \"embed\".",
			defaultImageFolder: "Dossier de pièces-jointes par défaut",
			defaultImageFolderDesc:
				"Pour utiliser un dossier différent de celui par défaut pour les pièces-jointes.",
			transferMetaFile:
				"Envoyer des fichiers en utilisant une clé de métadonnée",
			transferMetaFileDesc:
				"Mettez les noms des champs de métadonnées que vous voulez utiliser pour envoyer les fichiers. Séparez les champs par une virgule. Les champs Dataview sont pris en charge.",
		},
		githubWorkflow: {
			githubActionName: "Nom de l'action GitHub",
			githubActionNameDesc:
				"Si vous souhaitez activer une action github lorsque le plugin push le fichier, indiquez le nom du fichier (dans votre dossier \".github/worfklows\").",
			autoCleanUp: "Auto-nettoyage",
			autoCleanUpDesc:
				"Si le plugin doit retirer de votre dépôt les fichiers supprimés (arrêt de partage ou supprimé).",
			excludedFiles: "Fichier exclus",
			excludedFilesDesc:
				"Si vous voulez exclure certains dossiers du nettoyage automatique, définissez leur chemin.",
			useMetadataExtractor: "Fichier de metadata-extractor",
			useMetadataExtractorDesc:
				"Envoyer les fichiers générés par metadata-extractor dans ce dossier.",
			prRequest: {
				title: "Commit message",
				desc: "Le message envoyé lorsque la pull-request est fusionnée. Sera toujours suivie par le numéro de la pull-request."
			}
		},
		plugin: {
			pluginSettings: "Paramètres du plugin",
			shareKey: "Clé de partage",
			shareKeyDesc:
				"La clé de métadonnées pour publier votre fichier sur le dépôt.",
			excludedFolder: "Dossier exclus",
			excludedFolderDesc:
				"Les fichiers dans ses dossiers ne seront jamais publiés, quelle que soit l'état de la clé de partage. Séparez les noms de dossier par une virgule.",
			fileMenu: "Menu \"Fichier\"",
			fileMenuDesc:
				"Ajouter une commande de partage dans le menu \"Fichier\"",
			editorMenu: "Menu \"Edition\"",
			editorMenuDesc:
				"Ajouter une commande de partage dans le menu du clic droit.",
			copyLink: {
				copylinkSetting: "Copie de lien.",
				copylinkDesc:
					"Envoyer un lien vers votre note dans votre presse-papier.",
				baselink: "Lien du blog",
				baselinkDesc:
					"Créer le lien du presse-papiers avec cette base. Par défaut : https://username.github.io/repo/.",
				linkpathremover: "Retirer une partie du lien",
				linkpathremoverDesc:
					"Supprimer cette partie des liens créés. Séparer par une virgule si plusieurs valeurs doivent être supprimées.",
			},
			logNoticeHeader: "Notifier toutes les erreurs",
			logNoticeDesc:
				"Sur mobile, il peut être difficile de debug le module. Activer cette option pour notifier toutes les erreurs via une notification Obsidian.",
			shareExternalModifiedTitle:
				"Partager les fichiers modifiés externes",
			shareExternalModifiedDesc:
				"Envoyer les fichiers modifiés s'ils sont différents du fichier actif. Utile si vous modifier les métadonnées à l'aide de Metadata Menu ou MetaEdit.",
		},
		help: {
			help: "Aide",
			usefulLinks: {
				title: "Liens utiles",
				documentation: "Documentation",
				repository: "Dépôt",
				issue: "Issue",
				discussion: "Discussion",
				links: "https://obsidian-publisher.netlify.app/fr",
			},
			frontmatter: {
				title: "Aide mémoire frontmatter",
				desc: "Il existe quelque clés YAML qui peuvent vous être utile. Le code ci-dessous montre les paramètres par défaut, mais n'hésitez pas à le modifier selon vos besoins pour chaque note !",
				share: "Permet de partager une note.",
				mdlinks: "Convertit tous les wikilinks en liens markdowns",
				convert: {
					enableOrDisable:
						"Active ou désactive la conversion des liens. En désactivant cette option, vous supprimez les",
					or: "ou",
					syntax: "syntaxes, tout en gardant le nom du fichier ou son texte alternatif.",
				},
				internals:
					"Convertit les liens internes vers leur homologue dans le site web, sous forme de chemin relatif. Désactivé, les liens seront conservés tels quels.",
				nonShared:
					"Convertit les liens internes pointant vers un fichier non partagé vers leur homologue dans le site web, avec un chemin relatif. Désactivé, le plugin conservera le nom du fichier.",
				embed: {
					send: "Envoie les notes transclues du fichier partagé dans le dépôt. Seuls les fichiers partagés seront envoyés !",
					remove: "Supprime les notes transclues du fichier partagé, en ne laissant qu'une ligne vide.",
				},
				attachment: {
					send: "Envoie toutes les pièces jointes dans le dépôt Git.",
					folder: "Change le dossier par défaut pour les pièces jointes.",
				},
				dataview: "Convertit les queries dataview en markdown.",
				hardBreak:
					"Convertit tous les sauts de ligne en «hard break» markdown.",
				repo: {
					desc: "Changer le dépôt GitHub pour cette note.",
					owner: "Pseudo du propriétaire du dépôt",
					repo: "Nom du dépôt",
					branch: "Nom de la branche",
				},
				titleKey: "Change le titre de la note.",
				autoclean: "Désactive ou active le nettoyage automatique.",
				baselink:
					"Change le lien de base pour la commande de copie de lien.",
			},
			multiRepoHelp: {
				title: "Envoie dans plusieurs dépôts",
				desc: "Si vous souhaitez envoyer vos notes dans plusieurs dépôt en même temps, vous pouvez utiliser la clé ",
				desc2: "dans votre frontmatter. La valeur de cette clé doit être une liste. Chaque dépôt doit avoir les clés suivantes ",
				exampleDesc:
					"Le code YAML ci-dessous montre un exemple basé sur vos paramètres.",
			},
		},
	},
	informations: {
		startingClean: (repoInfo: string): string =>
			`Début du nettoyage ${repoInfo}...`,
		scanningRepo: "Scan du dépôt, cela peut prendre un moment...",
		foundNoteToSend: (noteLength: string) =>
			`Trouvé ${noteLength} nouvelles notes à envoyer !`,
		noNewNote: "Aucune nouvelle note à partager.",
		successfullPublish: (noticeValue: string[]) =>
			`Publication réussie de ${noticeValue[0]} vers ${noticeValue[1]}.`,
		waitingWorkflow: "Maintenant, attente de la complétion du workflow...",
		sendMessage: (noticeValue: string[]) =>
			`Envoi de ${noticeValue[0]} à ${noticeValue[1]}${noticeValue[2]}.`,
	},
	error: {
		unablePublishNote: (fileInfo: string): string =>
			`Impossible de publier la note ${fileInfo}, ignorée.`,
		errorPublish: (repoInfo: string): string =>
			`Erreur lors de la publication sur ${repoInfo}.`,
		unablePublishMultiNotes:
			"Impossible de publier plusieurs notes, quelque chose s'est mal passé.",
		mergeconflic: "La pull-request n'est pas fusionnable, vous avez besoin de le faire manuellement.",
		errorConfig: (repoInfo: string): string =>
			`Erreur de configuration pour ${repoInfo}. Merci de vérifier vos paramètres.`,
		isEmpty: (repoInfo: string): string => `${repoInfo} est vide.`,
		whatEmpty: {
			owner: "Le nom du propriétaire",
			repo: "Le nom du dépôt",
			branch: "Le nom de la branche",
			ghToken: "Le token GitHub",
		},
	},
	modals: {
		import: {
			title: "Importer",
			desc: "Importer des paramètres depuis un fichier ou un texte. Cela écrasera vos paramètres actuels (sauf le nom du repo, votre nom d'utilisateur ainsi que votre token).",
			importFromFile: "Importer depuis un fichier",
			save: "Sauvegarder",
			paste: "Coller la configuration ici...",
			error : {
				span: "Erreur lors de l'importation de la configuration : ",
				isEmpty: "la configuration est vide",
			}
		},
		export: {
			title: "Exporter",
			desc: "Exporter les paramètres vers un fichier ou dans le presse-papier.",
			copy: "Copier dans le presse-papier",
			download: "Télécharger",
		}
	}
};
