
# Github Publisher

GitHub Publisher is a plugin that help you to send file in a configured GitHub Repository, based on a frontmatter sharing key.

You can use it to send any markdown file, allowing compatibility thought a lot of Obsidian Publish alternative (like Mkdocs, Jekyll, Hugo or any solution that use Markdown files).

When a shared file is found, it will be sent in a new branch named by `your_vault_name-month-day-year`. A pull request followed by a merge will be done, and if everything is okay, the branch will be deleted after the merge.
Thus, you can easily revert commit, and create workflow based on PR, merged PR, specific push...

## What the plugin can do:

- Read the frontmatter to check the value of a configured `share` key.
- Send the file (and their embedded attachments or notes if any) to a GitHub repository.

But the plugin can do a lot more!

- Convert wiki-links to Markdown links (without changing your file)
- Activate a GitHub action that have a `workflow_dispatche` event.
- Convert internal's links to match the configuration
- Clean your repo with removing deleted and unshared files
- Rename folder note with same name strategies with `index.md` (+ respecting the folder settings)
- Send a link's note in your clipboard after sharing.
- Convert simple dataview query in markdown!
- ✨ Replace text using regex expression (or a simple string...)!
- ✨ Send your inlines tags to your frontmatter (in the `tags` key) **and** convert some field value to tags

## What the plugin CANNOT do:

- [ ] Support use of a local folder instead of a GitHub Repository (see [local folder](https://obsidian-publisher.netlify.app/obsidian/local%20folder/))
- [ ] Synchronize a GitHub repository with your vault (see [Obsidian Git](https://github.com/denolehov/obsidian-git) / [Obsidian Git Mobile](https://github.com/Vinzent03/obsidian-git-mobile))
- [ ] Revive the dead (see [Cardiopulmonary resuscitation](https://en.wikipedia.org/wiki/Cardiopulmonary_resuscitation))

---

## Settings

To use the plugin, you need to fill the correct information to allow the workflow.

### Configuration example

You will find [here](https://obsidian-publisher.netlify.appObsidian%20Github%20Publisher/Configuration%20example/) configuration example for some Obsidian Publish alternative, as Obsidian Mkdocs Publisher and [@TuanManhCao Digital Garden](https://github.com/TuanManhCao/digital-garden).

> [!note] Adding configuration
> You can send me or do a pullrequest to add new configuration for any Obsidian **free** publish alternative.

### GitHub

- **Repo name**: The repository where the files will be sent.
- **GitHub username**: Your username.
- **GitHub Token**: Get your [GitHub Token here](https://github.com/settings/tokens/new?scopes=repo)[^2]. The correct settings should already be applied. If you want to avoid generating this every few months, select the “No expiration” option. Click the “Generate token” button, and copy the token you are presented with on the next page.
- Branch name: The branch where the files will be sent. If you want to use a specific branch. By default, it is `main`, but you can change for whatever you want, but the branch must exist.
- You can disable the automatic branch merging.

It is possible to use per-file configuration to change the repository name, username, and branch. You can find more information about it [here](https://obsidian-publisher.netlify.app/obsidian/per%20files%20settings/#changing-repository).

### Upload configuration

You can find an example of the edited part of the frontmatter [here](https://obsidian-publisher.netlify.app/obsidian/filepath_example).

#### Folder reception settings.

You have tree options :

- Use a “fixed” folder : Every file will be sent in this folder.
- Use a folder created based on a `category` key.
- Use the relative path from obsidian. You can prepend a folder using the default folder.

You need, in all case, to configure the **default folder** : The file will be sent here.

> If you use the option for frontmatter, this folder will be the default folder : the file will be sent here if the key doesn't exist.

##### Metadata frontmatter

Using the second option will activate two more options :

- Front matter key: The key you want to use in your file.
- Root folder : To prepend a path **before** the category key found (if any key are found!)

##### Fixed folder

Every file will be sent in the default folder. If you leave the default folder blank, it will be sent in the root of the repository.

##### Obsidian Path

It uses the relative path in your Obsidian vault. The default folder will be prepended before the relative obsidian path. You can leave it blank to use the root repository.

The `path removing` allow you to remove part of the path created, to, for example, sync subfolder. If the removed path is not found, the normal behavior apply.

#### Frontmatter title

You can change the filename with a configured frontmatter key.

#### Workflow

##### GitHub Actions

If your workflow must activate a GitHub action, set the name of it here.
Leave empty to remove it.

> [!note] The action will be triggered by a `workflow_dispatche` event.

##### Metadata Extractor

It is also possible to send file generated by [metadata extractor](https://github.com/kometenstaub/metadata-extractor) plugins. If you'd like to, just set the folder path where the file must be sent. 

> [!warning] Information
> 1. This option doesn't appear if you don't have the plugin installed ; 
> 2. The function only works on the desktop version (as the plugin `metadata-extractor` is not available on mobile).
> 3. Only the file generated in `.obsidian/plugins` will be sent. The plugin doesn't support external folder.

##### Auto clean-up

You can also set up an “uto-delete”when you use the commands to delete files:

- Deleted from your vault
- Which you have stopped sharing

This option will also add a new command to delete file (without sharing the new file).

> [!warning] Warning[^1]
> You can't use the delete command if you don't have set a default folder (and a root folder if you use the YAML configuration)
> Also, you can lose some files using this commands, so be careful! Please keep in mind that you can revert commit in case the plugin delete a file you want to avoid deleting.

> [!warning] Changing the option
> In case you change the folder configuration, the precedent file won't be deleted and result of a error of this workflow's part. Be careful!

You can set the path of the folder you want to avoid deleting the file. Separate folders with a comma.

> [!info] You can use regex here, but you need to enclose the regex between `/`.

Finally, to prevent deleting `index` created outside of obsidian, you could use some parameters in your front matter :

- `autoclean: false`
- `index: true`
  Or removing the `share` key.

> [!warning] About per-file repository
>
> - The cleanup commands only work for the repository set in the settings.
> - **But** the auto-clean up will work on the per-file repository during `sharing one note`
> - It's little tricky for attachment because they don't have frontmatter metadata. In this case, they will be deleted in global repository or in the per-file repository if it's a one file sharing.

### Content's conversion

> [!note] These settings won't change your file's content in your vault

#### Text

For some reason, you can need to convert text in your file. Here you can configure to :

- Use "hard break line" of the markdown specification, aka adding two spaces at the end of each line.
- Convert dataview queries to markdown. If this option is disabled, dataview queries will be removed entirely in the converted file.
- Text replacement : you can replace text by another one in the converted file, using a simple string or regex.
  - The replacement can be empty to remove the whole string.
  - You can set custom regex flags to arrange your regex. See [here for information about JS regex flags](https://javascript.info/regexp-introduction#flags)

#### Tags

This part allows pulling some contents to add them into your frontmatter `tags` field.

- <u>Inline Tags: </u> Add your inlines tags into your frontmatter and convert nested tags with replacing the `/` to `_` (for example, `#tag/subtag` will be converted to `tag_subtag`), also, consequently, fix your frontmatter as YAML standard.
- <u>Convert frontmatter/inline field into tags</u> : This will convert the value associated to preconfigured field into frontmatter tags. You can also prevent some value to be converted with the second field.
  _Note:_ If the value is a **link**, the converted value will be the filename or the displayed name. You can either exclude the filename or the displayed name.

#### Links

##### Index & folder note

Some publishing solution support folder note, but these note need to be named `index`. In case you use [Folder Note](https://github.com/aidenlx/alx-folder-note) with [the `same name` strategies](https://github.com/aidenlx/alx-folder-note/wiki/folder-note-pref) you will have a problem, no? By chance, I have a solution for you, guys!
Now, the plugin will convert these file into `index` if you activate the settings. Here are some examples of renaming, using the different parameters from the default folder.
> [!note] This option doesn't work for Obsidian Path + Same name strategies **outside** of folder.

> [!warning] This option doesn't work with fixed folder.

##### Internal links

This option will convert the internal links (including attachments links!) of the shared file to match the relative file in your repo. Only **existent**, **shared** and from the **same repo** file will be converted.

The next option allows you to convert links to files that are not shared. Useful if you already plan to share a file, but haven't done so yet, without having to go over every mention!

##### Wikilinks to Markdown link

In case you use wikilinks as daily but your obsidian publish solution doesn't support it, you can use these settings to convert the wiki to MD link.

### Embed

You can choose to send embedded files :

- Attachments : The file will be copied to the repository in an optional settled folder.
- Notes : Only shared files will be copied in the repository, in their respected folder (following your settings).

### Plugin settings

You can configure :

- The share key used by the plugin. By default, it is `share`
- Folder excluded. The share key can't work here. Useful if you forget to remove the `share` (or turn it to `false`) and move a file in your archive…
  You can use regex here, but you need to enclose the regex between `/`.

- Add the command to share the file on the file menu (right-click on a file in the explorer or using the three dot) and editor menu (right-click on an opened edited note)
- Added the link's shared note in your clipboard after sharing. You can configure the path created here, with removing some part. As it supports multiple part, you can separate the part using comma. For example, you can remove docs and the extension using : `docs/, .md`

  > [!note] The right-click menu command can also send the file under your cursor if it's a link!

---

> [!info] There are a lot of option that can be edited in the frontmatter. [See here for more informations](https://obsidian-publisher.netlify.app/obsidian/per%20files%20settings/#Frontmatter-keys-explanation)

---

## Usage

The plugin adds seven commands, with one also applied on the right-click menu.

- `Upload single current active note`
- `Upload all notes`
- `Upload unpublished notes`
- `Refresh published and upload new notes`
- `Refresh all published notes`
- `Purge depublished and deleted files`
- `Test the connection to the configured repository`

Each command are explained [here](https://obsidian-publisher.netlify.app/en/Obsidian/Commands).

# Developing

Check [here](https://obsidian-publisher.netlify.app/en/obsidian/developping/) if you want to help the plugin development. 

---

## Useful links

- [The documentation](https://obsidian-publisher.netlify.app/)
- [The repository](https://github.com/ObsidianPublisher/obsidian-github-publisher)
- [Mkdocs Template](https://github.com/ObsidianPublisher/publisher-template-gh-pages)
- [Github Discussion](https://github.com/ObsidianPublisher/obsidian-github-publisher/discussions)

---

If you find this plugin and workflow useful, you can give me some coffee money : <br/>
<a href='https://ko-fi.com/X8X54ZYAV' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://cdn.ko-fi.com/cdn/kofi1.png?v=3' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>

[^1]: Only file supported by Obsidian will be deleted.
[^2]: Obviously, you need to be connected and have a GitHub account to create this token!
