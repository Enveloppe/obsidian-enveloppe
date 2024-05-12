import { createLinkCallback, createLinkOnActiveFile } from "./create_link";
import { purgeCallback,purgeForRepo } from "./purge";
import { checkRepositoryValidityCallback, repositoryValidityActiveFile } from "./repository_validity";
import { refreshAllSets, refreshOpenedSet } from "./set";
import { uploadAllNotes, uploadAllNotesCallback } from "./share/all_notes";
import { shareEditedOnly, shareEditedOnlyCallback, uploadAllEditedNotes, uploadAllEditedNotesCallback } from "./share/edited_notes";
import { uploadNewNotes, uploadNewNotesCallback } from "./share/new_notes";
import { shareActiveFile, shareOneNoteCallback } from "./share/unique_note";

export {
	checkRepositoryValidityCallback,
	createLinkCallback,
	createLinkOnActiveFile,
	purgeForRepo as deleteCommands,
	purgeCallback as purgeNotesRemoteCallback,
	refreshAllSets,
	refreshOpenedSet,
	repositoryValidityActiveFile,
	shareActiveFile,
	shareEditedOnly,
	shareEditedOnlyCallback,
	shareOneNoteCallback,
	uploadAllEditedNotes,
	uploadAllEditedNotesCallback,
	uploadAllNotes,
	uploadAllNotesCallback,
	uploadNewNotes,uploadNewNotesCallback};