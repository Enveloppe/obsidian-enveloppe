import type { ConvertedLink, GithubRepo, Properties } from "@interfaces/main";
import type { TFile } from "obsidian";
import { mustBeDeleted, toSharedPaths } from "src/GitHub/delete";

export type FileStatus = "published" | "modified" | "unpublished" | "orphan";
export type EntryKind = "note" | "attachment";

export interface InventoryEntry {
	/** Path in the repository (relative to the dry-run folder in dry-run mode), unique per scan */
	id: string;
	kind: EntryKind;
	status: FileStatus;
	/** Source file in the vault; missing for orphans */
	file?: TFile;
	/** Blob sha in the repository, when the file exists there */
	sha?: string;
	/** Folder note: the autoclean may keep it depending on its frontmatter */
	isIndex?: boolean;
}

export interface InventorySource {
	/** Every shared file of the vault, with backlinks for the attachments */
	local: ConvertedLink[];
	/** Every file of the repository branch */
	remote: GithubRepo[];
	/** Files of the repository the autoclean manages (see `filterGithubFile`) */
	managed: GithubRepo[];
	target: Properties;
	/** True when the note frontmatter sends it to the target repository */
	isTargeted: (prop: Properties | Properties[]) => boolean;
	/** `settings.upload.folderNote.rename` */
	indexName?: string;
}

export const isPublishableNote = (file: TFile) =>
	file.extension === "md" && !file.name.endsWith(".excalidraw.md");

export function buildInventory(source: InventorySource): InventoryEntry[] {
	const { local, remote, managed, target, isTargeted, indexName } = source;
	const remoteByPath = new Map(remote.map((file) => [file.file, file]));
	const entries = new Map<string, InventoryEntry>();

	for (const link of local) {
		if (link.prop) {
			if (!isPublishableNote(link.real) || !isTargeted(link.prop)) continue;
			const path = link.converted.trim();
			const remoteFile = remoteByPath.get(path);
			entries.set(path, {
				id: path,
				kind: "note",
				status: remoteFile ? "published" : "unpublished",
				file: link.real,
				sha: remoteFile?.sha,
			});
			continue;
		}
		// attachments are listed only once published: they follow the notes embedding them
		for (const path of [link.converted, ...(link.otherPaths ?? [])]) {
			const remoteFile = remoteByPath.get(path);
			if (!remoteFile || entries.has(path)) continue;
			entries.set(path, {
				id: path,
				kind: "attachment",
				status: "published",
				file: link.real,
				sha: remoteFile.sha,
			});
		}
	}

	const shared = toSharedPaths(local);
	for (const file of managed) {
		if (entries.has(file.file) || !mustBeDeleted(file.file, shared, target)) continue;
		entries.set(file.file, {
			id: file.file,
			kind: file.file.endsWith(".md") ? "note" : "attachment",
			status: "orphan",
			sha: file.sha,
			isIndex: !!indexName && file.file.includes(indexName),
		});
	}

	return [...entries.values()].sort((a, b) => a.id.localeCompare(b.id));
}

export type StatusFilter = FileStatus | "all";

export function countByStatus(entries: InventoryEntry[]): Record<StatusFilter, number> {
	const counts: Record<StatusFilter, number> = {
		all: entries.length,
		published: 0,
		modified: 0,
		unpublished: 0,
		orphan: 0,
	};
	for (const entry of entries) counts[entry.status]++;
	return counts;
}

export function filterEntries(
	entries: InventoryEntry[],
	status: StatusFilter,
	query: string
): InventoryEntry[] {
	const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
	return entries.filter((entry) => {
		if (status !== "all" && entry.status !== status) return false;
		if (terms.length === 0) return true;
		const haystack = `${entry.id} ${entry.file?.path ?? ""}`.toLowerCase();
		return terms.every((term) => haystack.includes(term));
	});
}

/** A published file is "modified" when the vault copy is newer than its last commit */
export function isModified(vaultMtime: number, remoteDate: Date | null): boolean {
	return remoteDate !== null && vaultMtime > remoteDate.getTime();
}

/**
 * Writes done since the last scan, by remote path. The listing may not show them
 * yet: pull request waiting for a merge, or a tree served from the HTTP cache.
 */
export type PendingWrites = Map<string, "push" | "delete">;

export function withPending(files: GithubRepo[], pending: PendingWrites): GithubRepo[] {
	if (pending.size === 0) return files;
	const result = files.filter((file) => pending.get(file.file) !== "delete");
	const present = new Set(result.map((file) => file.file));
	for (const [path, action] of pending)
		if (action === "push" && !present.has(path)) result.push({ file: path, sha: "" });
	return result;
}

/** Forget the writes the repository listing now shows */
export function settlePending(remote: GithubRepo[], pending: PendingWrites) {
	const present = new Set(remote.map((file) => file.file));
	for (const [path, action] of pending)
		if ((action === "push") === present.has(path)) pending.delete(path);
}
