Credit : [@oleeskild](https://github.com/oleeskild/obsidian-digital-garden) for the idea and the majority of the code.

Obsidian's Mkdocs Publication is an association between a github actions and a Material mkdocs template to get a personal wiki site based on your Obsidian Vault. 
 
 <h1 align="center"><a href="https://mara-li.github.io/mkdocs_obsidian_template">Documentations & show case</a></center>
 
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

# The blog
## Creation

In your new `publish_blog` folder, you will spot a `mkdocs.yml`. This file allows you to customize your blog! The most important to edit :
1. `site_name` 
2. `site_description`
3. `site_url` (critical) : By default, it's `https://github_username.io/repo_name`[^3]

To edit the logo and the favicon, first put the chosen file in `assets/logo`, and change `logo` and `favicon` :
1. `logo: assets/logo/logo_name.png`
2. `favicon: assets/logo/favicon.png`

You can customize :
- Font
- Color scheme, palette, icons 
- Language  

Also, don't forget to delete the documentation folder, the contents in assets and clean the notes folder!

[Check the documentation to get more information](https://squidfunk.github.io/mkdocs-material/setup/changing-the-colors/)

You don't need to touch anything in `features` ; `markdown_extensions…`

## Local testing (optional)

To run locally the blog, you need to install the requirements and run `mkdocs serve`.
```
cd publish_blog
pip install -r requirements.txt
mkdocs serve
```

The blog will be published through [GitHub Page](https://pages.github.com/) using the `gh-page` branch. Everything is already configured by the template for that.

## Customization
### Custom attributes

You can create [Inline Markdown Attribute](https://python-markdown.github.io/extensions/attr_list/) using hashtags in Obsidian. For example, to align some text to right :
1. Add 
```css
#right {
 display: inline-block;
 width: 100%;
 text-align: right;
 font-weight: normal;
}
```
2. Add `#right` on the last part of a line : 
```md
Lorem ipsum dolor sit amet, consectetur adipiscing elit. In mollis, libero porttitor gravida accumsan, justo metus pulvinar nulla, vitae dictum odio ligula non nisl. Vivamus id venenatis nulla. Nullam sed euismod ligula. Pellentesque tempor elit felis, lobortis vulputate risus gravida et. Curabitur auctor sed libero nec consectetur. Nam placerat rhoncus risus, euismod sagittis eros bibendum ac. Maecenas tellus libero, porttitor ac purus sit amet, viverra suscipit dolor. Proin id nisl velit. Ut at tincidunt libero, ac pharetra mi. Integer non luctus nisi. #right
```
It will appear as: 

![image](https://user-images.githubusercontent.com/30244939/162494417-5822c814-8103-4a08-a1b4-f123fad059f2.png)

### Folder note

You can create a folder note if you use a `category` front matter key that have the last folder with the same name as the file. For example : 
`category: folder1/folder2/filename`. The file `filename` will be renamed `index` and the folder will be named `filename`.

To support the citation and link to these page, you need to use and configure an index key. 

Some examples of citation and their transformation : 

| In Obsidian               	| In Publish            	|
| ------------------------- 	| --------------------- 	|
| `[[Real File\|(i) Alias]]` 	| `[[index\|Alias]]`     	|
| `[[Real File\|(i)]]`       	| `[[index\|Real File]]` 	|
| `[(i) Alias](Real file) ` 	| `[Alias](index)`      	|
| `[(i)](real file)`        	| `[real file](index)`  	| 

### Callout & Admonition

he script support custom admonition. For that, you first need to edit [custom_attributes](https://github.com/Mara-Li/mkdocs_obsidian_template/blob/main/docs/assets/css/custom_attributes.css) with adding the support, as follow in [Admonition's docs](https://squidfunk.github.io/mkdocs-material/reference/admonitions/#customization).
For example, to add a `dictionnary` admonition:
```css
:root {
    --md-admonition-icon--dictionnary: url('data:image/svg+xml;charset=utf-8, <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M18 22a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-6v7L9.5 7.5 7 9V2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12z"/></svg>')
}
.md-typeset .admonition.dictionnary,
.md-typeset details.dictionnary {
  border-color: rgb(43, 155, 70);
}
.md-typeset .dictionnary > .admonition-title,
.md-typeset .dictionnary > .summary {
  background-color: rgba(43, 155, 70, 0.1);
  border-color: rgb(43, 155, 70);
}
.md-typeset .dictionnary > .admonition-title::before,
.md-typeset .dictionnary > summary::before {
  background-color: rgb(43, 155, 70);
  -webkit-mask-image: var(--md-admonition-icon--dictionnary);
          mask-image: var(--md-admonition-icon--dictionnary);

```

![image](https://user-images.githubusercontent.com/30244939/162494669-fc79a28d-165d-4054-b9e5-03273865e0fa.png)

The `dictionnary` will be recognized, and converted !

# OBS2MK — Github actions

Obs2mk is a python script used here as a github actions. The plugin and the script relies on the frontmatter of the note you want to publish :

1. `share: true` allow publishing the file
2. `category` to choose where the file will be after conversion ; allowing categorization for the blog.
    - `category: false` will **hide** the file from navigation.
    - `category: hidden` will do the same.
    - `category: folder1/folder2/` will move the file in `folder2`, under `folder1`
    - `category: folder1/folder2/filename` will rename the file `index` and allow support of [section's index page](https://squidfunk.github.io/mkdocs-material/setup/setting-up-navigation/#section-index-pages)  
3. `description` : Add a description to the file (for meta-tag sharing)[^4]
4. `title` : Change the title in the navigation.
5. `image` : Add an image for meta-tags sharing.[^4] It needs to be the name of the file, as `image.png`. 

## Configuration
The configuration's file of the actions is `.github-actions`, localized under the `source` folder on your blog.
The configuration is handled by the plugin directly, in settings. You can update it any time using the `update settings workflow` command.
There is three configuration : 
- The index key, for folder note citation.
- The default category key and the default folder. For the default folder, using "/" will put the file in the root.

# The plugins

Now, if everything is configured, you will have :
- In file-menu, a option to publish one file. The file will be sended (with their image) in github, in the `source` folder.
- In command palette (CTRL+P) you can also publish one file, or every file with `share: true` in their frontmatter.

⚠️ The source folder will be cleaned after the conversion from the script !

# Limitations
- You need to have a clean tree structure with **unique name file**. No worry about the display in blog ; the `title` key in frontmatter will change it, so you can have a `ezarezozre` name and use a good title like `reading book`. 
- I prefer to encourage you to use the `shortlinks` option in obsidian's link option.
- Obsiously, no obsidian's plugin will work.
- No graph view
- index ([from folder-note](#folder-note)) won't be deleted.
- The github action will don't move the file if you change the category key : you need to manually delete it to prevent duplicate. 

# Update the template

 Using a template (in place of fork) prevent to get the update I do sometimes. So, to keep an eye on it, you need to create a branch based on the template. 
 
In the cloned folder, your blog, do : 
```bash
git remote add Template git@github.com:Mara-Li/mkdocs_obsidian_template.git
git fetch Template
git checkout -b template Template/main
```
To get the update :
```bash
git checkout template
git pull
```
You can merge the branch, or just get the updated file with the checkout command : 
```bash
git checkout main
git checkout template path/file/youwant 
git add . && git commit -am "updated template" && git push
```

# Metacopy

I choose to use [Metacopy](https://github.com/Mara-Li/obsidian-metacopy) to allow the rapid copy of the link to your blog.
To create a link, you need to configure : 
- `category` (you need to use the same from `category_key` from configuration) in **key**
- Add your `set_url` in **base link**
- Add the same `category` key in **key link**
![image](https://user-images.githubusercontent.com/30244939/162501286-26746e15-0e31-4f5a-bc3d-f00c617da869.png)
![image](https://user-images.githubusercontent.com/30244939/162501298-892a5819-e720-4928-be39-0c8c5570c863.png)

So, in the end, a menu will appear on file with `share: true` and a `category` configured. This menu is on the left click and the file-menu. You can quickly copy a link from there, like a Google or notion sharing link! 
![https://www.loom.com/share/88c64da2ba194e219578d5911fb8e08d](https://mara-li.github.io/mkdocs_obsidian_template/assets/img/demo.gif)

# Plugins to use with Mkdocs Publication :
- [Customizable Sidebar](https://github.com/phibr0/obsidian-customizable-sidebar)
- [Customizable Menu](https://github.com/kzhovn/obsidian-customizable-menu)
- [Customizable Page Header](https://github.com/kometenstaub/customizable-page-header-buttons)
- [Alx Folder Notes](https://github.com/aidenlx/alx-folder-note)

For custom attribute :
- [CM6 Custom Attributes](https://github.com/nothingislost/obsidian-cm6-attributes)
- [Markdown Attribute](https://github.com/valentine195/obsidian-markdown-attributes)
- [Contextual Typography](https://github.com/mgmeyers/obsidian-contextual-typography)

# Alternative
- [Digital Garden](https://github.com/oleeskild/obsidian-digital-garden)
- [Publish to Ghost](https://github.com/jaynguyens/obsidian-ghost-publish)


[^3]: You can found the link in Repository settings > Pages. 
[^1]: You must be connected to copy the template ! You can test locally through clone > https : `git clone https://github.com/Mara-Li/mkdocs_obsidian_template.git` or with [downloading the ZIP](https://github.com/Mara-Li/mkdocs_obsidian_template/archive/refs/heads/main.zip)
[^2]: You need to be connected to generate it.
[^5]: **Meta tags** are snippets of text that describe a page’s content; the meta tags don’t appear on the page itself, but only in the page’s source code. Meta tags are essentially little content descriptors that help tell search engines what a web page is about. [Source](https://www.wordstream.com/meta-tags)
