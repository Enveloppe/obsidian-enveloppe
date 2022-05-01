Obsidian's Mkdocs Publication is an association between a github actions and a Material mkdocs template to get a personal wiki site based on your Obsidian Vault.

# TLDR
1. Install the plugins through Obsidian Community or [BRAT](https://github.com/TfTHacker/obsidian42-brat)
2. [Template](https://github.com/Mara-Li/obsidian-mkdocs-publisher-template) the blog and configure it 
3. Configure the plugin's options
4. Add `share: true` in Obsidian's note frontmatter 
5. Customize (or not) the `category` key in Obsidian's note frontmatter. 
6. Run the commands throught the file menu or commands palette.

# Quick installation tutorial
1. Click on [use this template](https://github.com/Mara-Li/mkdocs_obsidian_template/generate)[^1]
2. Use the name of your choice
3. Get your [Github Token here](https://github.com/settings/tokens/new?scopes=repo)[^2]. The correct settings should already be applied. If you don't want to generate this every few months, choose the "No expiration" option. Click the "Generate token" button, and copy the token you are presented with on the next page.
4. In Obsidian fill the options for mkdocs-publish :
    - Repo name
    - Your github username
    - The github token (copyed from earlier)
    - The share key
    - The category key name
    - The category key default value
    - The key citation for [folder-note](https://mara-li.github.io/obsidian_mkdocs_publisher_docs/documentation/blog%20customization/#folder-note)

# Configuration
The configuration's file of the actions is `.github-actions`, localized under the `source` folder on your blog.
The configuration is handled by the plugin directly, in settings. You can update it any time using the `update settings workflow` command.
There is three configuration : 
- The index key, for folder note citation.
- The default category key and the default folder. For the default folder, using "/" will put the file in the root.

You can use the plugin to update your configuration. To do that, you can edit :
- The category key name and the default value
- The citation key

Use the commands "Update settings workflow" to update the `.github-action`. 

If everything is configured, you will have :
- In file-menu, a option to publish one file. 
- In command palette (CTRL+P) you can also publish one file, or every file with `share: true` in their frontmatter.


The files (and the image) will be send on your github repository template, in the `source` folder. The conversion will be done by the [github actions](https://mara-li.github.io/obsidian_mkdocs_publisher_docs/documentation/obs2mk/github%20actions/), before the build. You can also add manually the files in `source` or use `obs2mk` in parallels. 

⚠️ The source folder will be cleaned after the conversion from the script !

---
# Useful links
- [Main Repo](https://github.com/Mara-Li/obsidian_mkdocs_publisher)
- [Obsidian Plugin](https://github.com/Mara-Li/obsidian-mkdocs-publisher-plugin/)
- [Python package](https://github.com/Mara-Li/obsidian-mkdocs-publisher-python)
- [Template](https://github.com/Mara-Li/obsidian-mkdocs-publisher-template)
- [Documentation](https://mara-li.github.io/obsidian_mkdocs_publisher_docs/)

## How to...
- [Configure the blog](https://mara-li.github.io/obsidian_mkdocs_publisher_docs/documentation/create%20the%20blog/)
- [Customize the blog](https://mara-li.github.io/obsidian_mkdocs_publisher_docs/documentation/blog%20customization/)
- [Copy the link ?](https://mara-li.github.io/obsidian_mkdocs_publisher_docs/documentation/useful%20plugins/#metacopy)
- [Update the template](https://mara-li.github.io/obsidian_mkdocs_publisher_docs/documentation/Q%26A/#2-update-the-template)

## Support
- [x] Wikilinks (`[[Links]]`)
- [x] File transclusion/embed, both wikilinks and markdown links
- [x] Obsidian callout and custom callout
- [x] Folder notes and their citation
- [x] Custom attributes
- [x] Sharing state and custom folder hierarchy.
- [x] Mobile and desktop
- [x] File mini preview on Hover

## Limitations
- No plugins (dataview...)
- No graph view
- You need to have a clean tree structure with unique name file. No worry about the display in blog ; the `title` key in frontmatter will change it, so you can have a `ezarezozre` name and use a good title like `reading book`. 
-  I prefer to encourage you to use the `shortlinks`option in obsidian’s link option. 
-  index (from [folder note](https://mara-li.github.io/obsidian_mkdocs_publisher_docs/documentation/blog%20customization/#folder-note)) won’t be deleted : You need to do it manually using github. 
- Obs2mk will don’t move the file if you change the `category` value : you need to manually delete it to prevent duplicate. 

[^1]: You must be connected to copy the template ! You can test locally through clone > https : `git clone https://github.com/Mara-Li/mkdocs_obsidian_template.git` or [with downloading the ZIP](https://github.com/Mara-Li/mkdocs_obsidian_template/archive/refs/heads/main.zip)
[^2]: You need to be connected to generate it.
