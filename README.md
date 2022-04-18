Obsidian's Mkdocs Publication is an association between a github actions and a Material mkdocs template to get a personal wiki site based on your Obsidian Vault.

# TLDR

1. Install the plugins through Obsidian Community or [BRAT](https://github.com/TfTHacker/obsidian42-brat)
2. [Template](https://github.com/Mara-Li/mkdocs_obsidian_template) the blog and configure it 
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
    - The key citation for [[folder-note|blog customization#folder-note]]

# Configuration
The configuration's file of the actions is `.github-actions`, localized under the `source` folder on your blog.
The configuration is handled by the plugin directly, in settings. You can update it any time using the `update settings workflow` command.
There is three configuration : 
- The index key, for folder note citation.
- The default category key and the default folder. For the default folder, using "/" will put the file in the root.

---

Now, if everything is configured, you will have :
- In file-menu, a option to publish one file. 
- In command palette (CTRL+P) you can also publish one file, or every file with `share: true` in their frontmatter.


The files (and the image) will be send on your github repository template, in the `source` folder. The conversion will be done by the [[github actions]], before the build. You can also add manually the files in `source` or use `obs2mk` in parallels. 

⚠️ The source folder will be cleaned after the conversion from the script !

[^1]: You must be connected to copy the template ! You can test locally through clone > https : `git clone https://github.com/Mara-Li/mkdocs_obsidian_template.git` or [with downloading the ZIP](https://github.com/Mara-Li/mkdocs_obsidian_template/archive/refs/heads/main.zip)
[^2]: You need to be connected to generate it.
