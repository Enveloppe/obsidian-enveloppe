import type { App } from "obsidian";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { confirm } from "../confirm_modal";
import { t } from "../i18n";
import {
	countByStatus,
	type FileStatus,
	filterEntries,
	type InventoryEntry,
	type StatusFilter,
} from "../inventory";
import type { ManagerState } from "../service";
import {
	basename,
	EmptyState,
	formatTime,
	Icon,
	IconButton,
	ProgressBar,
	useManagerContext,
} from "./common";

const PAGE_SIZE = 150;
const FILTERS: StatusFilter[] = ["all", "modified", "unpublished", "published", "orphan"];

const STATUS_ICON: Record<FileStatus, string> = {
	published: "check-circle-2",
	modified: "pencil-line",
	unpublished: "circle-dashed",
	orphan: "unlink",
};

function entryIcon(entry: InventoryEntry): string {
	if (entry.status === "orphan") return entry.kind === "note" ? "file-x" : "image-off";
	return entry.kind === "note" ? "file-text" : "image";
}

export function FilesTab({ app, state }: { app: App; state: ManagerState }) {
	const { manager } = useManagerContext();
	const [filter, setFilter] = useState<StatusFilter>("all");
	const [query, setQuery] = useState("");
	const [selected, setSelected] = useState<Set<string>>(new Set());
	const [limit, setLimit] = useState(PAGE_SIZE);
	const lastClicked = useRef<string | null>(null);

	const counts = useMemo(() => countByStatus(state.entries), [state.entries]);
	const visible = useMemo(
		() => filterEntries(state.entries, filter, query),
		[state.entries, filter, query]
	);
	const awaitingMerge = useMemo(
		() => new Set(state.awaitingMerge),
		[state.awaitingMerge]
	);

	// drop the selection of files gone after a scan
	useEffect(() => {
		const ids = new Set(state.entries.map((e) => e.id));
		setSelected((current) => {
			const kept = [...current].filter((id) => ids.has(id));
			return kept.length === current.size ? current : new Set(kept);
		});
	}, [state.entries]);
	useEffect(() => setLimit(PAGE_SIZE), [filter, query, state.repoKey]);

	const selection = state.entries.filter((e) => selected.has(e.id));
	const publishable = selection.filter((e) => e.kind === "note" && e.file);
	const removable = selection.filter((e) => e.status !== "unpublished");
	const locked = state.busy || state.scanning;
	const allVisibleSelected =
		visible.length > 0 && visible.every((e) => selected.has(e.id));

	const toggle = (entry: InventoryEntry, range: boolean) => {
		setSelected((current) => {
			const next = new Set(current);
			const anchor = lastClicked.current;
			const select = !current.has(entry.id);
			if (range && anchor) {
				const from = visible.findIndex((e) => e.id === anchor);
				const to = visible.findIndex((e) => e.id === entry.id);
				if (from !== -1 && to !== -1) {
					for (const e of visible.slice(Math.min(from, to), Math.max(from, to) + 1)) {
						if (select) next.add(e.id);
						else next.delete(e.id);
					}
					return next;
				}
			}
			if (select) next.add(entry.id);
			else next.delete(entry.id);
			return next;
		});
		lastClicked.current = entry.id;
	};

	const toggleAll = () => {
		setSelected((current) => {
			const next = new Set(current);
			for (const e of visible) {
				if (allVisibleSelected) next.delete(e.id);
				else next.add(e.id);
			}
			return next;
		});
	};

	const publish = (entries: InventoryEntry[]) => {
		setSelected(new Set());
		void manager.publish(entries);
	};

	const remove = async (entries: InventoryEntry[]) => {
		const targets = entries.filter((e) => e.status !== "unpublished");
		if (targets.length === 0) return;
		const repo = manager.repositories().find((r) => r.key === state.repoKey)?.label ?? "";
		const stillShared = targets.filter((e) => e.kind === "note" && e.file).length;
		const ok = await confirm(app, {
			title: t("confirm.deleteTitle", { count: targets.length, repo }),
			description: [manager.dryRun ? t("confirm.deleteDryRun") : t("confirm.deleteDesc")],
			warning:
				stillShared > 0 ? t("confirm.stillShared", { count: stillShared }) : undefined,
			paths: targets.map((e) => e.id),
			confirmLabel: t("actions.delete"),
			destructive: true,
		});
		if (!ok) return;
		setSelected(new Set());
		void manager.remove(targets);
	};

	if (!state.scannedAt) {
		return (
			<div class="enveloppe-manager-files">
				{state.error ? (
					<div class="enveloppe-manager-callout mod-error">
						<Icon name="alert-triangle" />
						<span>{state.error}</span>
					</div>
				) : null}
				<EmptyState icon={state.scanning ? "loader" : "folder-search"}>
					{state.scanning ? (
						t("empty.scanning")
					) : (
						<>
							<p>{t("empty.never")}</p>
							<button type="button" class="mod-cta" onClick={() => void manager.scan()}>
								{t("actions.scan")}
							</button>
						</>
					)}
				</EmptyState>
			</div>
		);
	}

	return (
		<div class="enveloppe-manager-files">
			<div class="enveloppe-manager-filters" role="tablist">
				{FILTERS.map((status) => (
					<button
						type="button"
						key={status}
						role="tab"
						aria-selected={filter === status}
						class={`enveloppe-manager-chip status-${status} ${filter === status ? "is-active" : ""}`}
						aria-label={status === "all" ? undefined : t(`statusHelp.${status}`)}
						data-tooltip-position="top"
						onClick={() => setFilter(status)}
					>
						{status !== "all" && <span class="enveloppe-manager-dot" />}
						<span>{t(`status.${status}`)}</span>
						<span class="enveloppe-manager-count">{counts[status]}</span>
					</button>
				))}
			</div>

			<div class="enveloppe-manager-search">
				<Icon name="search" />
				<input
					type="search"
					placeholder={t("search")}
					value={query}
					onInput={(event) => setQuery((event.target as HTMLInputElement).value)}
				/>
			</div>

			{state.stale && !state.scanning && (
				<div class="enveloppe-manager-callout">
					<Icon name="info" />
					<span>{t("stale")}</span>
					<button type="button" onClick={() => void manager.scan()}>
						{t("actions.refresh")}
					</button>
				</div>
			)}
			{state.error && (
				<div class="enveloppe-manager-callout mod-error">
					<Icon name="alert-triangle" />
					<span>{state.error}</span>
				</div>
			)}
			{state.checking && (
				<div class="enveloppe-manager-callout">
					<Icon name="loader" className="is-spinning" />
					<span>
						{t("checking", { done: state.checking.done, total: state.checking.total })}
					</span>
					<button type="button" onClick={() => manager.stopCheck()}>
						{t("actions.cancel")}
					</button>
					<ProgressBar value={state.checking.done} max={state.checking.total} />
				</div>
			)}

			{selection.length > 0 && (
				<div class="enveloppe-manager-selection">
					<span class="enveloppe-manager-selection-count">
						{t("selected", { count: selection.length })}
					</span>
					<button
						type="button"
						class="mod-cta"
						disabled={locked || publishable.length === 0}
						onClick={() => publish(publishable)}
					>
						<Icon name="upload-cloud" />
						{t("actions.publish")}
					</button>
					<button
						type="button"
						class="mod-warning"
						disabled={locked || removable.length === 0}
						onClick={() => void remove(removable)}
					>
						<Icon name="trash-2" />
						{t("actions.delete")}
					</button>
					<IconButton
						icon="x"
						label={t("actions.clearSelection")}
						onClick={() => setSelected(new Set())}
					/>
				</div>
			)}

			<div class="enveloppe-manager-list-header">
				<input
					type="checkbox"
					aria-label={t("actions.selectAll")}
					checked={allVisibleSelected}
					disabled={visible.length === 0}
					onChange={toggleAll}
				/>
				<span class="enveloppe-manager-list-meta">
					{visible.length}/{state.entries.length}
				</span>
				<span class="enveloppe-manager-list-meta">
					{t("scannedAt", { time: formatTime(state.scannedAt) })}
				</span>
			</div>

			<div class="enveloppe-manager-list" role="list">
				{visible.length === 0 ? (
					<EmptyState icon="search-x">{t("empty.none")}</EmptyState>
				) : (
					visible
						.slice(0, limit)
						.map((entry) => (
							<FileRow
								key={entry.id}
								entry={entry}
								selected={selected.has(entry.id)}
								awaitingMerge={awaitingMerge.has(entry.id)}
								locked={locked}
								onToggle={toggle}
								onPublish={() => publish([entry])}
								onRemove={() => void remove([entry])}
							/>
						))
				)}
				{visible.length > limit && (
					<button
						type="button"
						class="enveloppe-manager-more"
						onClick={() => setLimit(limit + PAGE_SIZE)}
					>
						{t("actions.showMore", {
							count: Math.min(PAGE_SIZE, visible.length - limit),
						})}
					</button>
				)}
			</div>
		</div>
	);
}

function FileRow({
	entry,
	selected,
	awaitingMerge,
	locked,
	onToggle,
	onPublish,
	onRemove,
}: {
	entry: InventoryEntry;
	selected: boolean;
	awaitingMerge: boolean;
	locked: boolean;
	onToggle: (entry: InventoryEntry, range: boolean) => void;
	onPublish: () => void;
	onRemove: () => void;
}) {
	const { manager } = useManagerContext();
	const remoteUrl = manager.remoteUrl(entry);
	const canOpen = !!entry.file || (manager.dryRun && entry.status !== "unpublished");
	const title = entry.file?.basename ?? basename(entry.id);
	const sourcePath = entry.file?.path;

	return (
		<div
			role="listitem"
			class={`enveloppe-manager-row status-${entry.status} ${selected ? "is-selected" : ""}`}
			onClick={(event) => onToggle(entry, event.shiftKey)}
		>
			<input
				type="checkbox"
				checked={selected}
				aria-label={title}
				onClick={(event) => {
					event.stopPropagation();
					onToggle(entry, event.shiftKey);
				}}
			/>
			<Icon name={entryIcon(entry)} className="enveloppe-manager-kind" />
			<div class="enveloppe-manager-row-main">
				{canOpen ? (
					<a
						class="enveloppe-manager-row-title"
						href="#"
						onClick={(event) => {
							event.preventDefault();
							event.stopPropagation();
							void manager.openNote(entry, event.ctrlKey || event.metaKey);
						}}
					>
						{title}
					</a>
				) : (
					<span class="enveloppe-manager-row-title">{title}</span>
				)}
				<span class="enveloppe-manager-row-path" title={sourcePath}>
					{entry.id}
				</span>
			</div>
			<div class="enveloppe-manager-badges">
				{awaitingMerge && (
					<span
						class="enveloppe-manager-badge mod-pr"
						aria-label={t("badges.prHelp")}
						data-tooltip-position="top"
					>
						{t("badges.pr")}
					</span>
				)}
				{entry.isIndex && (
					<span
						class="enveloppe-manager-badge"
						aria-label={t("badges.indexHelp")}
						data-tooltip-position="top"
					>
						{t("badges.index")}
					</span>
				)}
				<span
					class={`enveloppe-manager-status status-${entry.status}`}
					aria-label={t(`statusHelp.${entry.status}`)}
					data-tooltip-position="top"
				>
					<Icon name={STATUS_ICON[entry.status]} />
					<span class="enveloppe-manager-status-label">
						{t(`status.${entry.status}`)}
					</span>
				</span>
			</div>
			<div class="enveloppe-manager-row-actions">
				{remoteUrl && (
					<IconButton
						icon="external-link"
						label={t("actions.openRemote")}
						onClick={() => window.open(remoteUrl)}
					/>
				)}
				{entry.kind === "note" && entry.file && (
					<IconButton
						icon="upload-cloud"
						label={
							entry.status === "unpublished"
								? t("actions.publish")
								: t("actions.republish")
						}
						disabled={locked}
						onClick={onPublish}
					/>
				)}
				{entry.status !== "unpublished" && (
					<IconButton
						icon="trash-2"
						label={t("actions.delete")}
						className="mod-warning"
						disabled={locked}
						onClick={onRemove}
					/>
				)}
			</div>
		</div>
	);
}
