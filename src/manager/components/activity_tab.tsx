import { useState } from "preact/hooks";
import type { ActivityEvent, Operation, TaskStatus } from "../activity";
import { t } from "../i18n";
import {
	EmptyState,
	formatTime,
	Icon,
	IconButton,
	ProgressBar,
	useManagerContext,
	useStore,
} from "./common";

const TASK_ICON: Record<TaskStatus | "running", string> = {
	queued: "clock",
	running: "loader",
	done: "check",
	skipped: "minus",
	error: "x",
};

const KIND_ICON: Record<Operation["kind"], string> = {
	publish: "upload-cloud",
	delete: "trash-2",
	check: "search-check",
};

export function ActivityTab() {
	const { activity } = useManagerContext();
	const { operations, events } = useStore(activity, () => ({
		operations: activity.operations,
		events: activity.events,
	}));

	return (
		<div class="enveloppe-manager-activity">
			<div class="enveloppe-manager-section-header">
				<h6>{t("activity.operations")}</h6>
				<IconButton
					icon="eraser"
					label={t("actions.clearActivity")}
					onClick={() => activity.clear()}
					disabled={operations.length === 0 && events.length === 0}
				/>
			</div>
			{operations.length === 0 ? null : (
				<div class="enveloppe-manager-operations">
					{operations.map((op) => (
						<OperationCard key={op.id} operation={op} />
					))}
				</div>
			)}

			<div class="enveloppe-manager-section-header">
				<h6>{t("activity.log")}</h6>
			</div>
			{events.length === 0 ? (
				<EmptyState icon="inbox">{t("activity.emptyLog")}</EmptyState>
			) : (
				<ol class="enveloppe-manager-log">
					{events.map((event) => (
						<LogLine key={event.id} event={event} />
					))}
				</ol>
			)}
		</div>
	);
}

function OperationCard({ operation }: { operation: Operation }) {
	const running = operation.status === "running";
	const [open, setOpen] = useState(running);
	const done = operation.items.filter(
		(item) => item.status !== "queued" && item.status !== "running"
	).length;
	const errors = operation.items.filter((item) => item.status === "error").length;
	const isOpen = open || running;

	return (
		<div class={`enveloppe-manager-operation is-${operation.status}`}>
			<button
				type="button"
				class="enveloppe-manager-operation-header"
				aria-expanded={isOpen}
				onClick={() => setOpen(!open)}
			>
				<Icon name={KIND_ICON[operation.kind]} />
				<span class="enveloppe-manager-operation-title">
					{t(`activity.kinds.${operation.kind}`)} · {operation.target}
				</span>
				<span class="enveloppe-manager-operation-meta">
					{running ? (
						<Icon name="loader" className="is-spinning" />
					) : (
						<Icon name={operation.status === "error" ? "alert-triangle" : "check"} />
					)}
					{t("activity.progress", { done, total: operation.items.length })}
					{errors > 0 && <span class="enveloppe-manager-errors">{errors}</span>}
					<span>{formatTime(operation.startedAt)}</span>
				</span>
				<Icon name={isOpen ? "chevron-down" : "chevron-right"} />
			</button>
			<ProgressBar value={done} max={operation.items.length} />
			{isOpen && (
				<ul class="enveloppe-manager-operation-items">
					{operation.items.map((item) => (
						<li key={item.key} class={`is-${item.status}`} title={item.message}>
							<Icon
								name={TASK_ICON[item.status]}
								className={item.status === "running" ? "is-spinning" : undefined}
							/>
							<span class="enveloppe-manager-item-label">{item.label}</span>
							{item.message && (
								<span class="enveloppe-manager-item-message">{item.message}</span>
							)}
						</li>
					))}
				</ul>
			)}
		</div>
	);
}

function LogLine({ event }: { event: ActivityEvent }) {
	return (
		<li class={`enveloppe-manager-log-line is-${event.status}`} title={event.error}>
			<span class="enveloppe-manager-log-time">{formatTime(event.time)}</span>
			<Icon
				name={TASK_ICON[event.status]}
				className={event.status === "running" ? "is-spinning" : undefined}
			/>
			<Icon name={event.action === "push" ? "arrow-up-from-line" : "trash"} />
			<span class="enveloppe-manager-log-path">{event.path}</span>
			<span class="enveloppe-manager-log-target">{event.target}</span>
		</li>
	);
}
