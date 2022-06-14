GitHub Publisher is a plugin that help you to send file in a configured GitHub Repository, based on a front matter entry state. 

You can use it to send any markdown file, allowing compatibility thought a lot of Obsidian Publish alternative. 

When a shared file is found, it will be sent in a new branch named by `your_vault_name-month-day-year`. A pull request followed by a merge will be done, and if everything is okay, the branch will be deleted after the merge. 
Thus, you can easily revert commit, and create workflow based on PR, merged PR, specific push... 

# What the plugin do

- Read the frontmatter to check the value of a configured `share` key.
- Send the file (and their embedded image if any) to GitHub

But the plugin can do a lot more !
- Convert wikilinks to markdown links (without changing your file)
- Activate a GitHub action that have a `workflow_dispatche` event.
- Convert internal's links to match the configuration
- Clean your repo with removing deleted and unshared files
- Rename folder note with same name strategies with `index.md` (+ respecting the folder settings)

---
# Configuration

To use the plugin, you need to fill the correct information to allow the workflow. 

## 1. GitHub 

- Repo name: The repository where the information will be sent.
- GitHub username: Your username.
- GitHub Token: Get your [GitHub Token here](https://github.com/settings/tokens/new?scopes=repo)[^2]. The correct settings should already be applied. If you want to avoid generating this every few months, select the “No expiration” option. Click the “Generate token” button, and copy the token you are presented with on the next page.


## 2. Download configuration
### Folder reception settings.

You have two options : 
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
>	- You use `category` in a file with `category: Roleplay/Characters/DND`  
>	- You set a root folder with `_docs/pages`  
>	- And you set a default folder on `_docs/draft`  
>	  
>	The final path (in GitHub!) will be : `_docs/pages/Roleplay/Characters/DND`  
>	  
>	But, if you don't set `category`, the path will be `_docs/draft`  

#### Fixed folder
Every file will be sent in the default folder. If you leave the default folder blank, it will be sent in the root of the repository. 

> [!example] Example
>	- If you set `source` for the default folder, any file will be sent in `your_repo/source`, whatever is their frontmatter key or their relative path.
>	- If you leave it blank, it will be sent in `your_repo` directly.

#### Obsidian Path
It uses the relative path in your Obsidian vault. The default folder will be prepended before the relative obsidian path. You can leave it blank to use the root repository.

> [!example] Example
>	For a file in `20. Compendium/DND/Monster`
>	- If you set `source` :  the final path will be `source/20. Compendium/DND/Monster`
>	- If you leave the default folder blank, the final path will be `20. Compendium/DND/Monster`

### Workflow 

If your workflow needs to activate a GitHub actions, set the name here. 

Leave it blank to disable the GitHub actions activation.

#### Auto clean-up

You can also set up an "auto-delete" when you use the commands to delete files:
- Deleted from your vault
- Which you have stopped sharing

This option will also add a new command to delete file (without sharing new file).

>[!warning] Warning
>	You can't use the delete command if you don't have set a default folder (and a root folder if you use the YAML configuration)
>	Also, you can lost some files using this commands, so be careful! Don't forget that you can revert commit in case the plugin delete a file you don't want to delete.

>[!warning] Changing the option
>	In case you change the folder configuration, the precedent file won't be deleted and result of a error of this workflow's part. Be careful!

You can set the path of the folder you want to avoid deleting the file. Separate folders a comma. 
>[!note] Regex are not supported here!

Finally, to prevent deleting `index` created outside of obsidian, you could use some parameters in your front matter : 
- `autoclean: false`
- `index: true`
Or removing the `share` key.

### Links' conversion

>[!note] These settings won't change your file's content in your vault

#### Index & folder note

Some publishing solution support folder note, but these note need to be named `index`. In case you use [Folder Note](https://github.com/aidenlx/alx-folder-note) with [the `same name` strategies](https://github.com/aidenlx/alx-folder-note/wiki/folder-note-pref) you will have a problem, no? By chance, I have a solution for you, guys!
Now, the plugin will convert these file into `index` if you activate the settings. Here some examples of renaming, using the different parameters from the default folder.

> [!example] frontmatter example with a file named `folder2`
>	- Using a category value : `folder1/folder2` 
>		- With root value named `docs` ⇒ `docs/folder1/folder2/index.md`
>		- Without root : `folder1/folder2/index.md` 
>	- Without category value, with default folder named `drafts` : `draft/folder2.md` (the name won't be converted!)

> [!example] Example with Obsidian Path & a file named `folder2`
>	With a path like : `folder1/folder2` the new path will be :
>	- If you use a default folder named `docs` : `docs/folder1/folder2/index.md`
>	- Without : `folder1/folder2/index.md`

>[!warning] This option doesn't work with fixed folder.

#### Internal links

This option will convert the internal link of the shared file to match the file in your repo. The path won't be converted if the file doesn't exist in your vault. 

#### wikilinks to markdown link

In case you use wikilinks as daily but your obsidian publish solution doesn't support it, you can use this settings to convert the wiki to md link. 

### Image

Occasionally, you want to avoid sending the image linked (why? Don't know. It's your GitHub repo, after all!). You can remove the transfer of these files.
If you choose to send image, you can set a default folder for image.

# 3. Plugin settings

You can configure :
- The share key used by the plugin. By default, it is `share`
- Folder excluded. The share key can't work here. Useful if you forget to remove the `share` (or turn it to `false`) and move a file in your archive…
- Add the command to share the file on the file menu (right-click on a file in the explorer or using the three dot) and editor menu (right-click on an opened edited note)
---
If you find this plugin and workflow useful, you can give me some coffee money.
<a href='https://ko-fi.com/X8X54ZYAV' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://cdn.ko-fi.com/cdn/kofi1.png?v=3' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>

[^1]: You must be connected to copy the template ! You can test locally through clone > https : `git clone https://github.com/Mara-Li/mkdocs_obsidian_template.git` or [with downloading the ZIP](https://github.com/Mara-Li/mkdocs_obsidian_template/archive/refs/heads/main.zip)
[^2]: You need to be connected to generate it.
[^3]: Normally, only file supported by obsidian are deleted, but some image exists only on the blog (for logo, for example). To prevent bad surprise, exclude these folder here.