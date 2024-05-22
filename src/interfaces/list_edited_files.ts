/**
 * Interface for list edited files
 * Allow to know which files was edited, deleted, added, unpublished, not deleted
 */
export interface ListEditedFiles {
	/** List of edited file path on the repository */
	edited: string[];
	/** List of deleted file path on the repository */
	deleted: string[];
	/** List of added file path on the repository */
	added: string[];
	/** List of unpublished file path on the repository */
	unpublished: string[];
	/** List of not deleted file path on the repository */
	notDeleted: string[];
}

/**
 * Interface for uploaded files
 * Used in ListEditedFiles to create it
 */
export interface UploadedFiles {
	/** Know if the file was updated on the repo or created */
	isUpdated: boolean;
	/** The path of the file */
	file: string;
}

/**
 * Interface for deleted files
 * Used in ListEditedFiles to create it
 * List deleted and undeleted file
 */
export interface Deleted {
	success: boolean;
	deleted: string[];
	undeleted: string[];
}
