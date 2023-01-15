---
title: Commands
---

The plugin adds seven commands, with one also applied on the right-click menu.

There are four types of commands : 
- `Upload`
- `Refresh`
- `Purge`
- `Test`

## Upload

Upload send the `share: true` file and their embedded contents (or note, based on your settings) to the configured repo. 

> [!note] « Shared » meaning here « which have the `share: true` frontmatter key.

It exists : 
- `Upload single current active note` *(also in the right-click menu)* : Send only the single current active note.  The repo can be changed using the [[en/Obsidian/Per files settings|frontmatter]].
- `Upload all notes` : Send all shared notes to the configured repository.
- `Upload unpublished notes` : Send only the shared note that are not present on the repository. 

## Refresh

Refresh scans the repository and update or send the notes based on some conditions.

- `Refresh all published notes` : It only updates the content of the published notes.
	Here, the commit date and the last edited time (from Obsidian) are compared. 
- `Refresh published and upload new notes` : It uploads the note not present in the repository and also update the note edited since the last push.
	Same as above, dates are compared.

## Purge

There is only one command here : `Purge depublished and deleted files`

> [!note] Depublished here means that the `share` key has been removed or set to `false`.

This command will clean your configured repository, with removing the file you deleted or stopped sharing.

## Test

Again, only one command  : `Test the connection to the configured repository`.

It will check if the repository exists, and also the main branch you set.
It also checks whether you forgot (or not) to set a value. 