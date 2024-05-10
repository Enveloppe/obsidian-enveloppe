//add customArrayDict<T>

import { TFile } from "obsidian";


declare module "obsidian" {
	interface CustomArrayDict<T> {
		data: Record<string, T[]>;

		add(key: string, value: T): void;
		clear(key: string): void;
		clearAll(): void;
		contains(key: string, value: T): boolean;
		count(): number;
		get(key: string): T[] | null;
		keys(): string[];
		remove(key: string, value: T): void;
		removeKey(key: string): void;
	}

	interface MetadataCache {
		getBacklinksForFile(file?: TFile): CustomArrayDict<LinkCache>;
	}
}