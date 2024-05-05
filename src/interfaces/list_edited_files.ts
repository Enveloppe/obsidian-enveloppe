export interface ListEditedFiles {
	edited: string[];
	deleted: string[];
	added: string[];
	unpublished: string[];
	notDeleted: string[];
}

export interface UploadedFiles {
	isUpdated: boolean;
	file: string;
}

export interface Deleted {
	success: boolean;
	deleted: string[];
	undeleted: string[];
}



