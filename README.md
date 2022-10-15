---
share: true
title: Obsidian Github Publisher
---

[FR 🇫🇷](https://github.com/obsidianPublisher/obsidian-github-publisher/blob/master/docs/README_FR.md)

- [Github Publisher](#github-publisher)
	- [What the plugin can do:](#what-the-plugin-can-do)
	- [What the plugin CANNOT do:](#what-the-plugin-cannot-do)
- [Global configuration](#global-configuration)
	- [Configuration example](#configuration-example)
	- [GitHub](#github)
	- [Upload configuration](#upload-configuration)
		- [Folder reception settings.](#folder-reception-settings)
			- [Metadata frontmatter](#metadata-frontmatter)
			- [Fixed folder](#fixed-folder)
			- [Obsidian Path](#obsidian-path)
		- [Frontmatter title](#frontmatter-title)
		- [Content's conversion](#contents-conversion)
			- [Text](#text)
			- [Tags](#tags)
			- [Links](#links)
				- [Index & folder note](#index--folder-note)
				- [Internal links](#internal-links)
				- [Wikilinks to markdown link](#wikilinks-to-markdown-link)
		- [Embed](#embed)
		- [Github Workflow](#github-workflow)
			- [Auto clean-up](#auto-clean-up)
	- [Plugin settings](#plugin-settings)
- [Per files configuration](#per-files-configuration)
- [Developping](#developping)
	- [General](#general)
	- [Translation](#translation)
- [Useful links](#useful-links)

# Github Publisher

GitHub Publisher is a plugin that help you to send file in a configured GitHub Repository, based on a frontmatter sharing key. 

You can use it to send any markdown file, allowing compatibility thought a lot of Obsidian Publish alternative (like Mkdocs, Jekyll, Hugo or any solution that use Markdown files). 

When a shared file is found, it will be sent in a new branch named by `your_vault_name-month-day-year`. A pull request followed by a merge will be done, and if everything is okay, the branch will be deleted after the merge. 
Thus, you can easily revert commit, and create workflow based on PR, merged PR, specific push... 

## What the plugin can do:

- Read the frontmatter to check the value of a configured `share` key.
- Send the file (and their embedded attachments or notes if any) to a GitHub repository

But the plugin can do a lot more !
- Convert wikilinks to markdown links (without changing your file)
- Activate a GitHub action that have a `workflow_dispatche` event.
- Convert internal's links to match the configuration
- Clean your repo with removing deleted and unshared files
- Rename folder note with same name strategies with `index.md` (+ respecting the folder settings)
- Send a link's note in your clipboard after sharing.
- Convert simple dataview query in markdown !
- ✨ Replace text using regex expression (or a simple string...)!
- ✨ Send your inlines tags to your frontmatter (in the `tags` key) **and** convert some field value to tags

## What the plugin CANNOT do:

- [ ] Support use of a local folder instead of a GitHub Repository (see [local folder](https://obsidian-publisher.netlify.app/obsidian/local%20folder/))
- [ ] Synchronize a GitHub repository with your vault (see [Obsidian Git](https://github.com/denolehov/obsidian-git) / [Obsidian Git Mobile](https://github.com/Vinzent03/obsidian-git-mobile))
- [ ] Revive the dead (see [Cardiopulmonary_resuscitation](https://en.wikipedia.org/wiki/Cardiopulmonary_resuscitation))

---

# Global configuration

To use the plugin, you need to fill the correct information to allow the workflow. 

## Configuration example

You will find [here](https://obsidian-publisher.netlify.appObsidian%20Github%20Publisher/Configuration%20example/) configuration example for some Obsidian Publish alternative, as Obsidian Mkdocs Publisher and [@TuanManhCao Digital Garden](https://github.com/TuanManhCao/digital-garden).

> [!note] Adding configuration
> You can send me or do a pullrequest to add new configuration for any Obsidian **free** publish alternative. 

## GitHub 

- Repo name: The repository where the files will be sent.
- GitHub username: Your username.
- GitHub Token: Get your [GitHub Token here](https://github.com/settings/tokens/new?scopes=repo)[^2]. The correct settings should already be applied. If you want to avoid generating this every few months, select the “No expiration” option. Click the “Generate token” button, and copy the token you are presented with on the next page.

## Upload configuration

### Folder reception settings.

You have tree options : 
- Use a “fixed” folder : Every file will be sent in this folder. 
- Use a folder created based on a `category` key.
- Use the relative path from obsidian. You can prepend a folder using the default folder. 

You need, in all case, to configure the **default folder** :  The file will be sent here.
> If you use the option for frontmatter, this folder will be the default folder : the file will be sent here if the key doesn't exist. 

#### Metadata frontmatter

Using the second option will activate two more options : 
- Front matter key: The key you want to use in your file.
- Root folder : To prepend a path **before** the category key found (if any key are found!)

> [!EXAMPLE] Example
> - You use `category` in a file with `category: Roleplay/Characters/DND`  
> - You set a root folder with `_docs/pages`  
> - And you set a default folder on `_docs/draft`  
>	  
> The final path (in GitHub!) will be : `_docs/pages/Roleplay/Characters/DND`  
>	  
> But, if you don't set `category`, the path will be `_docs/draft`  

#### Fixed folder
Every file will be sent in the default folder. If you leave the default folder blank, it will be sent in the root of the repository. 

> [!example] Example
> - If you set `source` for the default folder, any file will be sent in `your_repo/source`, whatever is their frontmatter key or their relative path.
> - If you leave it blank, it will be sent in `your_repo` directly.

#### Obsidian Path
It uses the relative path in your Obsidian vault. The default folder will be prepended before the relative obsidian path. You can leave it blank to use the root repository.

> [!example] Example
> For a file in `20. Compendium/DND/Monster`
> - If you set `source` :  the final path will be `source/20. Compendium/DND/Monster`
> - If you leave the default folder blank, the final path will be `20. Compendium/DND/Monster`

The `path removing` allow you to remove part of the path created, to, for example, sync subfolder. If the removed path is not found, the normal behavior apply. 

> [!example] Sync subfolder
> You can using this option to designate a subfolder as the "vault" for syncing the repository.
> You could plug in `vault/sub` as the path removed. The sync will flow `vault/sub` as `repo`. 
> A file in `vault/sub/folderA` will be sync in `repo/folderA`

### Frontmatter title

You can change the filename with the `title` frontmatter key.
> [!example] Example
> `title: My title`
> `filename` : `28-03-2020-1845.md`
> Final filename : `My title.md`


### Content's conversion

> [!note] These settings won't change your file's content in your vault

#### Text
For some reason, you can need to convert text in your file. Here you can configure to :
- Use "hard break line" of the markdown specification, aka adding two space at the end of each line.
- Convert dataview queries to markdown. If this option is disabled, dataview queries will be removed entirely in the converted file.
- Text replacement : you can replace text by another one in the converted file, using a simple string or regex. 
  - The given text is insensitive to case.
  - The replacement can be empty to remove the whole string.

#### Tags
This part allows pulling some contents to add them into your frontmatter `tags` field.
- <u>Inline Tags: </u> Add your inlines tags into your frontmatter and convert nested tags with replacing the `/` to `_` (for example, `#tag/subtag` will be converted to `tag_subtag`), also, consequently, fix your frontmatter as YAML standard. 
- <u>Convert frontmatter/inline field into tags</u> : This will convert the value associated to preconfigured field into frontmatter tags. You can also prevent some value to be converted with the second field.
	*Note:* If the value is a **link**, the converted value will be the filename or the displayed name. You can either exclude the filename or the displayed name. 

#### Links
##### Index & folder note

Some publishing solution support folder note, but these note need to be named `index`. In case you use [Folder Note](https://github.com/aidenlx/alx-folder-note) with [the `same name` strategies](https://github.com/aidenlx/alx-folder-note/wiki/folder-note-pref) you will have a problem, no? By chance, I have a solution for you, guys!
Now, the plugin will convert these file into `index` if you activate the settings. Here some examples of renaming, using the different parameters from the default folder.
Note : This option doesn't work for Obsidian Path + Same name strategies **outside** of folder. 

> [!example] frontmatter example with a file named `folder2`
> - Using a category value : `folder1/folder2` 
> - With root value named `docs` ⇒ `docs/folder1/folder2/index.md`
> - Without root : `folder1/folder2/index.md` 
> - Without category value, with default folder named `drafts` : `draft/folder2.md` (the name won't be converted!)

> [!example] Example with Obsidian Path & a file named `folder2`
> With a path like : `folder1/folder2` the new path will be :
> - If you use a default folder named `docs` : `docs/folder1/folder2/index.md`
> - Without : `folder1/folder2/index.md`

> [!warning] This option doesn't work with fixed folder.

##### Internal links

This option will convert the internal links (including attachments links!) of the shared file to match the relative file in your repo. Only **existant** and **shared** file will be converted.
> [!example] 
> Cited file : `docs/XX/YY/my_file.md`
> File to convert : `docs/XX/ZZ/new_file.md`
> Path created : `../YY/my_file.md`

##### Wikilinks to markdown link

In case you use wikilinks as daily but your obsidian publish solution doesn't support it, you can use this settings to convert the wiki to md link. 

### Embed

You can choose to send embeded files :
- Attachments : The file will be copied in the repository in an optionnaly settled folder.
- Notes : Only shared files will be copied in the repository, in their respected folder (following your settings).

### Github Workflow

If you workflow must activate a GitHub action, set the name of it here. 
Leave empty to remove it.

> [!note] The action will be triggered by a `workflow_dispatche` event.

#### Auto clean-up

You can also set up an "auto-delete" when you use the commands to delete files:
- Deleted from your vault
- Which you have stopped sharing

This option will also add a new command to delete file (without sharing new file).

> [!warning] Warning[^1]
> You can't use the delete command if you don't have set a default folder (and a root folder if you use the YAML configuration)
> Also, you can lost some files using this commands, so be careful! Don't forget that you can revert commit in case the plugin delete a file you don't want to delete.

> [!warning] Changing the option
> In case you change the folder configuration, the precedent file won't be deleted and result of a error of this workflow's part. Be careful!

You can set the path of the folder you want to avoid deleting the file. Separate folders a comma. 
> [!note] Regex are not supported here!

Finally, to prevent deleting `index` created outside of obsidian, you could use some parameters in your front matter : 
- `autoclean: false`
- `index: true`
Or removing the `share` key.


## Plugin settings

You can configure :
- The share key used by the plugin. By default, it is `share`
- Folder excluded. The share key can't work here. Useful if you forget to remove the `share` (or turn it to `false`) and move a file in your archive…
- Add the command to share the file on the file menu (right-click on a file in the explorer or using the three dot) and editor menu (right-click on an opened edited note)
- Added the link's shared note in your clipboard after sharing. You can configure the path created here, with removing some part. As it supports multiple part, you can separate the part using comma. For example, you can remove docs and the extension using : `docs/, .md`
> [!note] The right-click menu command can also send the file under your cursor if it's a link! 

---

# Per files configuration

Some settings can be overridden based on your frontmatter key (of the file send):
1. For links conversion, using the `links` key, you can create an yaml object with:
	- `mdlinks` : to force converting to markdown links.
	- `convert` : to remove the links to just keeps the string (alt text or filename).
	Note that you can use `links: false` and `mdlinks: true` outside the yaml object if you want to just use one option.
2. Embed settings, using the `embed` key :
	- `send:false` avoid the sending of the embedded files (not attachment!)
	- `remove: true` to remove any mention of these file
	As before, you can use one key settings using `embed` (for sending) and `removeEmbed` (for citation removing)
3. `Attachment` : allow per file settings for attachment (image, pdf, sound, video... Any attachment supported by Obsidian)
	- `send: false` to avoiding sending the files
	- `folder` to change the default folder. Beware that changing this settings can have strange effect with autocleaning!
	You can, again, use a one key settings using `attachmentLinks` for the folder and `attachment: false` to avoiding sending.
4. `dataview` to overrides dataview settings.
5. `hardbreak` for markdown hard break.

See [here for a quick reference](https://obsidian-publisher.netlify.app/obsidian/per%20files%20settings/)

---
# Developping

## General

You can help me to develop the plugin using `npm` !
1. First clone the project on your computer with `git clone git@github.com:obsidianPublisher/obsidian-github-publisher.git`
2. `cd obsidian-github-publisher`
3. `npm install`
4. Enjoy!

Some notes:
- I use [Conventional Commit](https://www.conventionalcommits.org/en/v1.0.0/) to generate the commit message, so please respect the format!
- To forget to documents your function!

## Translation

Using [i18n](https://www.i18next.com/), you can translate the plugin. 

To add a new language :
- Clone the `i18n/locales/en-us.ts` and rename it to your langage.
- Get your locale language from Obsidian using [obsidian translation](https://github.com/obsidianmd/obsidian-translations) or using the commands (in templater for example) : `<% tp.obsidian.moment.locale() %>` 
- Translate the file and save it.
- In `i18n/index.ts` :
  - Import the new file as `import language from '.locales/language'`
  - add the new language in the `localeMap` json object: `{ "language": language }`
- Additionnaly, you can test if your translation is okay.
- Create a PR to add your translation!

---
# Useful links
- [The documentation](https://obsidian-publisher.netlify.app/)
- [The repository](https://github.com/ObsidianPublisher/obsidian-github-publisher)
- [Mkdocs Template](https://github.com/ObsidianPublisher/obsidian-mkdocs-publisher-template)
- [The discord server](https://discord.gg/8FqxxjxGYx)

---
If you find this plugin and workflow useful, you can give me some coffee money : <br/>
<a href='https://ko-fi.com/X8X54ZYAV' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://cdn.ko-fi.com/cdn/kofi1.png?v=3' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>

[^1]: Only file supported by Obsidian will be deleted. 
[^2]: Obviously, you need to be connected and have a GitHub account to create this token!
