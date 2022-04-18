Credit : [@oleeskild](https://github.com/oleeskild/obsidian-digital-garden) for the idea and the majority of the code.

Obsidian's Mkdocs Publication is an association between a github actions and a Material mkdocs template to get a personal wiki site based on your Obsidian Vault. 
 
 <h1 align="center"><a href="https://mara-li.github.io/obsidian-mkdocs-publisher-template/">Documentations</a></center>
 
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
3. Get your [Github Token here](https://github.com/settings/tokens/new?scopes=repo,workflow)[^2]. The correct settings should already be applied. If you don't want to generate this every few months, choose the "No expiration" option. Click the "Generate token" button, and copy the token you are presented with on the next page.
4. In Obsidian fill the options for mkdocs publisher :
    - Repo name
    - Your github username
    - The github token (copyed from earlier)
    - The share key
    - The category key name
    - The category key default value
    - The key citation for [folder note](#folder-note)

# Limitations
- You need to have a clean tree structure with **unique name file**. No worry about the display in blog ; the `title` key in frontmatter will change it, so you can have a `ezarezozre` name and use a good title like `reading book`. 
- I prefer to encourage you to use the `shortlinks` option in obsidian's link option.
- Obsiously, no obsidian's plugin will work.
- No graph view
- index ([from folder-note](#folder-note)) won't be deleted.
- The github action will don't move the file if you change the category key : you need to manually delete it to prevent duplicate. 


# Alternative
- [Digital Garden](https://github.com/oleeskild/obsidian-digital-garden)
- [Publish to Ghost](https://github.com/jaynguyens/obsidian-ghost-publish)


[^1]: You must be connected to copy the template ! You can test locally through clone > https : `git clone https://github.com/Mara-Li/mkdocs_obsidian_template.git` or with [downloading the ZIP](https://github.com/Mara-Li/mkdocs_obsidian_template/archive/refs/heads/main.zip)
[^2]: You need to be connected to generate it.
