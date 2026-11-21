import {
	type GithubRepo,
	GithubTiersVersion,
	type MonoRepoProperties,
	type Properties,
	type PropertiesConversion,
	type Repository,
} from "@interfaces";
import type { ConvertedLink } from "@interfaces/main";
import {
	Notice,
	normalizePath,
	Platform,
	type TAbstractFile,
	TFile,
	Vault,
} from "obsidian";
import type { GithubBranch } from "src/GitHub/branch";
import { filterGithubFile, trackDelete } from "src/GitHub/delete";
import type Enveloppe from "src/main";
import { getSettingsOfMetadataExtractor } from "src/utils";
import {
	checkIfRepoIsInAnother,
	checkRepositoryValidityWithProperties,
	getDryRunFolder,
} from "src/utils/data_validation_test";
import {
	frontmatterSettingsRepository,
	getProperties,
} from "src/utils/parse_frontmatter";
import { errorMessage } from "./activity";
import { t } from "./i18n";
import {
	buildInventory,
	type InventoryEntry,
	isModified,
	type PendingWrites,
	settlePending,
	withPending,
} from "./inventory";

export interface RepoOption {
	key: string;
	label: string;
	repository: Repository | null;
}

export interface ManagerState {
	repoKey: string;
	scanning: boolean;
	/** publish or delete running from the manager */
	busy: boolean;
	checking: { done: number; total: number } | null;
	error?: string;
	entries: InventoryEntry[];
	scannedAt?: number;
	/** the vault or the repository changed since the last scan */
	stale: boolean;
	/** remote paths changed in a pull request that is not merged automatically */
	awaitingMerge: string[];
}

interface Context {
	repository: Repository | null;
	publisher: GithubBranch;
	prop: Properties;
	convert: PropertiesConversion;
	dryRun: boolean;
}

interface ScanResult {
	target: string;
	prop: Properties;
	dryRun: boolean;
	local: ConvertedLink[];
	remote: GithubRepo[];
	managed: GithubRepo[];
	/** last commit date of the notes looked at by `checkModified` */
	commitDates: Map<string, Date | null>;
}

const CHECK_CONCURRENCY = 4;
export const DEFAULT_REPO_KEY = "default";

export class FileManager {
	state: ManagerState = {
		repoKey: DEFAULT_REPO_KEY,
		scanning: false,
		busy: false,
		checking: null,
		entries: [],
		stale: false,
		awaitingMerge: [],
	};
	private listeners = new Set<() => void>();
	private cancelCheck = false;
	private rescanRequested = false;
	private openViews = 0;
	private lastScan?: ScanResult;
	/** by `owner/repo` */
	private pending = new Map<string, PendingWrites>();
	private seenEvents = new Set<number>();

	constructor(private plugin: Enveloppe) {
		let wasRunning = false;
		plugin.activity.subscribe(() => {
			this.collectWrites();
			const running = plugin.activity.running;
			// an Enveloppe command ran outside the manager: refresh what the writes do not tell
			if (wasRunning && !running && !this.state.busy) {
				if (this.openViews > 0 && this.state.scannedAt) void this.scan();
				else this.markStale();
			}
			wasRunning = running;
		});
	}

	/** Called by each open view; returns the callback to call on close */
	attachView(): () => void {
		this.openViews++;
		return () => this.openViews--;
	}

	subscribe(listener: () => void): () => void {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	private setState(patch: Partial<ManagerState>) {
		this.state = { ...this.state, ...patch };
		for (const listener of this.listeners) listener();
	}

	get dryRun(): boolean {
		return this.plugin.settings.github.dryRun.enable;
	}

	repositories(): RepoOption[] {
		const { github } = this.plugin.settings;
		return [
			{
				key: DEFAULT_REPO_KEY,
				label: `${github.user}/${github.repo}`,
				repository: null,
			},
			...github.otherRepo.map((repo) => ({
				key: repo.smartKey,
				label: `${repo.smartKey} · ${repo.user}/${repo.repo}`,
				repository: repo,
			})),
		];
	}

	selectRepository(key: string) {
		if (key === this.state.repoKey) return;
		this.cancelCheck = true;
		this.lastScan = undefined;
		this.setState({
			repoKey: key,
			entries: [],
			scannedAt: undefined,
			error: undefined,
			stale: false,
			awaitingMerge: [],
		});
		void this.scan();
	}

	markStale() {
		if (this.state.scannedAt && !this.state.stale) this.setState({ stale: true });
	}

	private async context(): Promise<Context> {
		const option = this.repositories().find((r) => r.key === this.state.repoKey);
		const repository = option?.repository ?? null;
		const prop = getProperties(this.plugin, repository, null, true);
		return {
			repository,
			publisher: await this.plugin.reloadOctokit(repository?.smartKey),
			prop: Array.isArray(prop) ? prop[0] : prop,
			convert: frontmatterSettingsRepository(this.plugin, repository),
			dryRun: this.dryRun,
		};
	}

	private targetLabel(prop: Properties) {
		return `${prop.owner}/${prop.repo}`;
	}

	private currentProp(): Properties {
		const option = this.repositories().find((r) => r.key === this.state.repoKey);
		const prop = getProperties(this.plugin, option?.repository ?? null, null, true);
		return Array.isArray(prop) ? prop[0] : prop;
	}

	/** Apply the finished writes of every command to the listing, without waiting for a scan */
	private collectWrites() {
		const { events } = this.plugin.activity;
		const prop = this.currentProp();
		const current = this.targetLabel(prop);
		const unmerged: string[] = [];
		let changed = false;
		// oldest first, so the last write of a path wins
		for (const event of [...events].reverse()) {
			if (event.status !== "done" || this.seenEvents.has(event.id)) continue;
			this.seenEvents.add(event.id);
			let pending = this.pending.get(event.target);
			if (!pending) {
				pending = new Map();
				this.pending.set(event.target, pending);
			}
			pending.set(event.path, event.action);
			if (event.target !== current) continue;
			changed = true;
			this.lastScan?.commitDates.delete(event.path);
			if (!this.dryRun && !prop.automaticallyMergePR) unmerged.push(event.path);
		}
		if (this.seenEvents.size > events.length * 2)
			this.seenEvents = new Set(
				events.filter((e) => this.seenEvents.has(e.id)).map((e) => e.id)
			);
		if (!changed) return;
		this.refreshEntries(
			unmerged.length > 0
				? { awaitingMerge: [...new Set([...this.state.awaitingMerge, ...unmerged])] }
				: {}
		);
	}

	/** Rebuild the listing from the last scan and the writes done since */
	private refreshEntries(patch: Partial<ManagerState> = {}) {
		const scan = this.lastScan;
		if (!scan) {
			if (Object.keys(patch).length > 0) this.setState(patch);
			return;
		}
		const pending: PendingWrites =
			this.pending.get(scan.target) ?? new Map<string, "push" | "delete">();
		const entries = buildInventory({
			local: scan.local,
			remote: withPending(scan.remote, pending),
			managed: scan.managed.filter((file) => pending.get(file.file) !== "delete"),
			target: scan.prop,
			isTargeted: (prop) => checkIfRepoIsInAnother(prop, scan.prop),
			indexName: this.plugin.settings.upload.folderNote.rename,
		}).map((entry) => this.withModified(entry, scan));
		this.setState({ ...patch, entries });
	}

	private withModified(entry: InventoryEntry, scan: ScanResult): InventoryEntry {
		if (entry.status !== "published" || entry.kind !== "note" || !entry.file)
			return entry;
		// in dry-run, the "repository" is in the vault: comparing dates is free
		if (scan.dryRun) {
			const copy = this.dryRunFile(entry.id, scan.prop);
			return copy && entry.file.stat.mtime > copy.stat.mtime
				? { ...entry, status: "modified" }
				: entry;
		}
		const date = scan.commitDates.get(entry.id);
		return date !== undefined && isModified(entry.file.stat.mtime, date)
			? { ...entry, status: "modified" }
			: entry;
	}

	async scan() {
		if (this.state.scanning) {
			this.rescanRequested = true;
			return;
		}
		const repoKey = this.state.repoKey;
		this.setState({ scanning: true, error: undefined });
		try {
			const ctx = await this.context();
			if (!ctx.dryRun && (await this.plugin.loadToken(ctx.repository?.smartKey)) === "")
				throw new Error(t("errors.noToken"));
			const local = ctx.publisher.getAllFileWithPath(ctx.repository, ctx.convert, true);
			const remote = ctx.dryRun
				? this.dryRunFiles(ctx.prop)
				: await ctx.publisher.getAllFileFromRepo(ctx.prop.branch, ctx.prop, {
						throwOnError: true,
						noCache: true,
					});
			const managed = await filterGithubFile(remote, this.plugin.settings, ctx.prop);
			if (this.state.repoKey !== repoKey) return;
			const target = this.targetLabel(ctx.prop);
			const pending = this.pending.get(target);
			if (pending) settlePending(remote, pending);
			this.lastScan = {
				target,
				prop: ctx.prop,
				dryRun: ctx.dryRun,
				local,
				remote,
				managed,
				commitDates:
					this.lastScan?.target === target
						? this.lastScan.commitDates
						: new Map<string, Date | null>(),
			};
			this.refreshEntries({ scannedAt: Date.now(), stale: false });
		} catch (e) {
			this.plugin.console.trace(e);
			if (this.state.repoKey === repoKey) {
				this.lastScan = undefined;
				this.setState({ error: errorMessage(e), entries: [], scannedAt: undefined });
			}
		} finally {
			this.setState({ scanning: false });
			if (this.rescanRequested) {
				this.rescanRequested = false;
				void this.scan();
			}
		}
	}

	private dryRunFolder(prop: Properties) {
		return getDryRunFolder(this.plugin.settings.github.dryRun.folderName, prop);
	}

	private dryRunFiles(prop: Properties): GithubRepo[] {
		const folderPath = this.dryRunFolder(prop);
		const folder = this.plugin.app.vault.getFolderByPath(folderPath);
		if (!folder || folderPath === "/") return [];
		const files: GithubRepo[] = [];
		Vault.recurseChildren(folder, (file: TAbstractFile) => {
			if (file instanceof TFile)
				files.push({ file: normalizePath(file.path.replace(folderPath, "")), sha: "" });
		});
		return files;
	}

	private dryRunFile(path: string, prop: Properties) {
		return this.plugin.app.vault.getFileByPath(
			normalizePath(`${this.dryRunFolder(prop)}/${path}`)
		);
	}

	/** Compare the vault modification date with the last commit of each published note */
	async checkModified() {
		if (this.state.checking || this.dryRun) return;
		const repoKey = this.state.repoKey;
		const toCheck = this.state.entries.filter(
			(e) =>
				e.kind === "note" && e.file && e.status !== "unpublished" && e.status !== "orphan"
		);
		if (toCheck.length === 0) return;
		this.cancelCheck = false;
		this.setState({ checking: { done: 0, total: toCheck.length } });
		const ctx = await this.context();
		const commitDates = new Map<string, Date | null>();
		let done = 0;
		const queue = [...toCheck];
		const worker = async () => {
			while (queue.length > 0 && !this.cancelCheck) {
				const entry = queue.shift()!;
				try {
					const date = await ctx.publisher.getLastEditedTimeRepo(
						{ file: entry.id, sha: entry.sha ?? "" },
						ctx.prop
					);
					commitDates.set(entry.id, date);
				} catch (e) {
					this.plugin.console.trace(e);
				}
				done++;
				if (this.state.repoKey === repoKey)
					this.setState({ checking: { done, total: toCheck.length } });
			}
		};
		await Promise.all(Array.from({ length: CHECK_CONCURRENCY }, worker));
		if (this.state.repoKey !== repoKey || !this.lastScan) return;
		for (const [path, date] of commitDates) this.lastScan.commitDates.set(path, date);
		this.refreshEntries({ checking: null });
	}

	stopCheck() {
		this.cancelCheck = true;
		this.setState({ checking: null });
	}

	async publish(entries: InventoryEntry[]) {
		const files = [
			...new Set(entries.filter((e) => e.kind === "note" && e.file).map((e) => e.file!)),
		];
		if (files.length === 0 || this.state.busy) return;
		const ctx = await this.context();
		const { publisher, prop, dryRun } = ctx;
		const { activity, settings, console } = this.plugin;
		const opId = activity.startOperation(
			"publish",
			this.targetLabel(prop),
			files.map((file) => ({ key: file.path, label: file.path }))
		);
		this.setState({ busy: true });
		let failed = true;
		try {
			if (!(await checkRepositoryValidityWithProperties(publisher, prop, files.length))) {
				console.noticeErrorUpload(prop);
				return;
			}
			if (!dryRun) await publisher.newBranch(prop);
			const repo: MonoRepoProperties = {
				frontmatter: prop,
				repository: ctx.repository,
				convert: ctx.convert,
			};
			let uploaded = 0;
			for (const file of files) {
				activity.updateItem(opId, file.path, "running");
				try {
					// embedded notes are followed for a single note, like the "share one note" command
					const result = await publisher.publish(
						file,
						false,
						repo,
						[],
						files.length === 1,
						null
					);
					if (!result) {
						activity.updateItem(opId, file.path, "skipped", t("activity.skipped"));
						continue;
					}
					uploaded++;
					const errors = result.error.join("\n");
					activity.updateItem(opId, file.path, errors ? "error" : "done", errors);
				} catch (e) {
					console.trace(e);
					activity.updateItem(opId, file.path, "error", errorMessage(e));
				}
			}
			if (settings.upload.metadataExtractorPath.length > 0 && Platform.isDesktop) {
				const extractor = await getSettingsOfMetadataExtractor(this.plugin.app, settings);
				if (extractor) await publisher.uploadMetadataExtractorFiles(extractor, prop);
			}
			const updated = await publisher.updateRepository(prop, dryRun);
			if (!updated) {
				console.noticeErrorUpload(prop);
				return;
			}
			failed = false;
			await console.publisherNotification(
				publisher,
				files.length === 1 ? files[0] : uploaded,
				settings,
				prop
			);
		} catch (e) {
			console.trace(e);
			new Notice(errorMessage(e), settings.plugin.noticeLength);
		} finally {
			activity.endOperation(opId, failed);
			this.setState({ busy: false });
			await this.scan();
		}
	}

	/** Remove the files from the repository (or the dry-run folder), whatever the vault says */
	async remove(entries: InventoryEntry[]) {
		const targets = entries.filter((e) => e.status !== "unpublished");
		if (targets.length === 0 || this.state.busy) return;
		const ctx = await this.context();
		const { publisher, prop, dryRun } = ctx;
		const { activity, settings, console } = this.plugin;
		const opId = activity.startOperation(
			"delete",
			this.targetLabel(prop),
			targets.map((e) => ({ key: e.id, label: e.id }))
		);
		this.setState({ busy: true });
		let failed = true;
		let deleted = 0;
		try {
			if (dryRun) {
				for (const entry of targets) {
					activity.updateItem(opId, entry.id, "running");
					const file = this.dryRunFile(entry.id, prop);
					if (!file) {
						activity.updateItem(opId, entry.id, "skipped", t("activity.notFound"));
						continue;
					}
					await trackDelete(publisher, entry.id, prop, () =>
						this.plugin.app.fileManager.trashFile(file)
					);
					deleted++;
					activity.updateItem(opId, entry.id, "done");
				}
				failed = false;
				return;
			}
			if (!(await checkRepositoryValidityWithProperties(publisher, prop, targets.length)))
				return;
			await publisher.newBranch(prop);
			// a branch left by an earlier run may miss files published since
			try {
				await publisher.octokit.request("POST /repos/{owner}/{repo}/merges", {
					owner: prop.owner,
					repo: prop.repo,
					base: publisher.branchName,
					head: prop.branch,
				});
			} catch (e) {
				console.trace(e);
			}
			const onBranch = new Map(
				(
					await publisher.getAllFileFromRepo(publisher.branchName, prop, {
						throwOnError: true,
						noCache: true,
					})
				).map((f) => [f.file, f.sha])
			);
			for (const entry of targets) {
				const sha = onBranch.get(entry.id);
				if (!sha) {
					activity.updateItem(opId, entry.id, "skipped", t("activity.notFound"));
					continue;
				}
				activity.updateItem(opId, entry.id, "running");
				try {
					await trackDelete(publisher, entry.id, prop, () =>
						publisher.octokit.request("DELETE /repos/{owner}/{repo}/contents/{+path}", {
							owner: prop.owner,
							repo: prop.repo,
							path: entry.id,
							message: `DELETE FILE : ${entry.id}`,
							sha,
							branch: publisher.branchName,
						})
					);
					deleted++;
					activity.updateItem(opId, entry.id, "done");
				} catch (e) {
					console.trace(e);
					activity.updateItem(opId, entry.id, "error", errorMessage(e));
				}
			}
			if (deleted > 0 && !(await publisher.updateRepository(prop))) {
				console.noticeErrorUpload(prop);
				return;
			}
			failed = false;
		} catch (e) {
			console.trace(e);
			new Notice(errorMessage(e), settings.plugin.noticeLength);
		} finally {
			activity.endOperation(opId, failed);
			if (deleted > 0) console.noticeSuccess(t("notices.deleted", { count: deleted }));
			this.setState({ busy: false });
			await this.scan();
		}
	}

	async openNote(entry: InventoryEntry, newLeaf = false) {
		const ctx = await this.context();
		const file = entry.file ?? (ctx.dryRun ? this.dryRunFile(entry.id, ctx.prop) : null);
		if (file) await this.plugin.app.workspace.getLeaf(newLeaf).openFile(file);
	}

	/** URL of the file in the repository, or null in dry-run */
	remoteUrl(entry: InventoryEntry): string | null {
		if (this.dryRun || entry.status === "unpublished") return null;
		const { owner, repo, branch } = this.currentProp();
		const api = this.plugin.settings.github.api;
		const host =
			api.tiersForApi === GithubTiersVersion.Entreprise && api.hostname.length > 0
				? api.hostname.replace(/\/+$/, "")
				: "https://github.com";
		const path = entry.id.split("/").map(encodeURIComponent).join("/");
		return `${host}/${owner}/${repo}/blob/${encodeURIComponent(branch)}/${path}`;
	}
}
