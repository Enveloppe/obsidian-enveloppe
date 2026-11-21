import { setIcon } from "obsidian";
import type { ComponentChildren } from "preact";
import { createContext } from "preact";
import { useContext, useEffect, useLayoutEffect, useReducer, useRef } from "preact/hooks";
import type { ActivityLog } from "../activity";
import type { FileManager } from "../service";

export interface ManagerContextValue {
	manager: FileManager;
	activity: ActivityLog;
}

export const ManagerContext = createContext<ManagerContextValue | null>(null);

export function useManagerContext(): ManagerContextValue {
	const value = useContext(ManagerContext);
	if (!value) throw new Error("ManagerContext is missing");
	return value;
}

/** Re-render when an observable store emits */
export function useStore<T>(
	store: { subscribe(listener: () => void): () => void },
	read: () => T
): T {
	const [, rerender] = useReducer((n: number) => n + 1, 0);
	useEffect(() => store.subscribe(() => rerender(undefined)), [store]);
	return read();
}

export function Icon({ name, className }: { name: string; className?: string }) {
	const ref = useRef<HTMLSpanElement>(null);
	useLayoutEffect(() => {
		if (!ref.current) return;
		ref.current.empty();
		setIcon(ref.current, name);
	}, [name]);
	return (
		<span
			ref={ref}
			class={`enveloppe-manager-icon ${className ?? ""}`}
			aria-hidden="true"
		/>
	);
}

export function IconButton({
	icon,
	label,
	onClick,
	disabled,
	className,
	spin,
}: {
	icon: string;
	label: string;
	onClick: (event: MouseEvent) => void;
	disabled?: boolean;
	className?: string;
	spin?: boolean;
}) {
	return (
		<button
			type="button"
			class={`clickable-icon enveloppe-manager-icon-button ${className ?? ""}`}
			aria-label={label}
			data-tooltip-position="top"
			disabled={disabled}
			onClick={(event) => {
				event.stopPropagation();
				onClick(event);
			}}
		>
			<Icon name={icon} className={spin ? "is-spinning" : undefined} />
		</button>
	);
}

export function ProgressBar({ value, max }: { value: number; max: number }) {
	const percent = max === 0 ? 100 : Math.round((value / max) * 100);
	return (
		<div
			class="enveloppe-manager-progress"
			role="progressbar"
			aria-valuemin={0}
			aria-valuemax={max}
			aria-valuenow={value}
		>
			<div class="enveloppe-manager-progress-bar" style={{ width: `${percent}%` }} />
		</div>
	);
}

export function EmptyState({
	icon,
	children,
}: {
	icon: string;
	children: ComponentChildren;
}) {
	return (
		<div class="enveloppe-manager-empty">
			<Icon name={icon} />
			<div>{children}</div>
		</div>
	);
}

export function formatTime(time: number): string {
	return new Date(time).toLocaleTimeString(undefined, {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
	});
}

export function basename(path: string): string {
	return path.split("/").pop() ?? path;
}
