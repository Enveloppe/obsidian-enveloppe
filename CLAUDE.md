# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Enveloppe is an Obsidian plugin (TypeScript, bundled with esbuild) that converts notes and pushes them to a GitHub repository through Octokit: it creates a branch named after the vault, commits the converted files, then opens (and optionally merges) a PR. User docs live at https://enveloppe.ovh/.

## Commands

Package manager is bun (a `pnpm-lock.yaml` also exists).

- `bun run dev` / `bun run build`: esbuild watch / production bundle (`build` runs `tsc --noEmit --skipLibCheck` first via `prebuild`)
- `bun run lint`: `biome format --write src/` (formatting only; `biome check` also lints)
- `bun run test`: unit tests (vitest, `tests/unit/**/*.test.ts`); single file: `npx vitest run tests/unit/github/delete.test.ts`; filter by name with `-t "<name>"`
- `bun run test:e2e`: wdio against the vaults in `tests/e2e/vaults`
- `bun run sync:locale`: pulls translations

`src/i18n/locales` is a git submodule (Enveloppe/locales, SSH URL). Translation strings are not edited in this repo.

Unit tests mock `obsidian` and `obsidian-dataview` (`tests/unit/mocks/`). Import paths use `src/...` and the `@interfaces` alias (see `tsconfig.json` `paths`); vitest relies on `resolve.tsconfigPaths` in `vitest.config.mts`, so an older Vite will fail to resolve `src/...`.

## Architecture

Entry point is `src/main.ts` (`Enveloppe extends Plugin`). It owns settings, the Octokit client (`reloadOctokit`), and registers every command per configured repository through `chargeAllCommands`. A "repository" is either the main one from settings or an extra one selected via frontmatter (`Repository`, identified by `smartKey`).

Publish pipeline:

1. `src/commands/**` are thin command callbacks (`share/unique_note.ts`, `all_notes.ts`, `new_notes.ts`, `edited_notes.ts`, `purge.ts`, `file_menu/`). They build the repository properties and call into `GithubBranch`.
2. `src/GitHub/` is a class chain: `Publisher` (`upload.ts`, the per-note `publish()` entry point: frontmatter, embeds, conversion, upload, optional autoclean) <- `FilesManagement` (`files.ts`, collects shared files, embeds and linked files from the vault) <- `GithubBranch` (`branch.ts`, branch creation, pull requests, merge/cleanup). `delete.ts` removes published files that no longer exist or are no longer shared, in GitHub or in the dry-run folder.
3. `src/conversion/**` turns note text into the published markdown (wikilinks, links, dataview, paths, find/replace). `src/conversion/compiler/` holds the sub-converters.
4. `src/utils/parse_frontmatter.ts` resolves per-file and per-repository settings from frontmatter; `src/interfaces/` holds settings types and defaults (`@interfaces`); `src/settings/` is the settings UI and `migrate.ts` for settings migrations.

### Properties shapes

A note can publish to several repositories, so repository config travels in these types (`src/interfaces/properties.ts`): `MonoRepoProperties` (one `Properties`), `MultiRepoProperties` (`Properties | Properties[]`), and `MonoProperties`/`MultiProperties` (the same plus plugin and path info). `getProperties()` returns `Properties | Properties[]`, even for a single repository. Code receiving a `frontmatter` of these types must normalise to an array rather than assume a single object. For example, `publish()` overwrites `repo.frontmatter` with the `getProperties()` result, and the batch commands then pass that same object to `deleteFromGithub` (see issue #424).

## Conventions

- Keep comments short and only where they add something; do not add a JSDoc block to every function.
- Releases go through `bun run bump` (commit-and-tag-version) and the `hooks/` scripts.
