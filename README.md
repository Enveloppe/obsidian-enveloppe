---
title: Start here
---

Mkdocs Obsidian is an association between a python script and a Material mkdocs template to get a personal wiki site based on your Obsidian Vault.

<p align="center">
	<a href="https://github.com/Mara-Li/mkdocs_obsidian_publish"><img src="https://img.shields.io/github/license/Mara-Li/YAFPA-python"></img></a>
	<a href="https://www.python.org/"><img src="https://img.shields.io/pypi/pyversions/obs2mk"></img></a>
	<a href="https://pypi.org/project/obs2mk/"><img src="https://img.shields.io/pypi/v/obs2mk"></img></a>
	<a href="https://obsidian.md/"><img src="https://img.shields.io/badge/Auxiliary%20Tool-Obsidian-blueviolet"></img></a>
	<a href="https://github.com/Mara-Li/mkdocs_obsidian_template/wiki/Q&A/"><img src="https://img.shields.io/badge/-Q%26A-blue?logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNMTIgMkM2LjQ4NiAyIDIgNi40ODYgMiAxMnM0LjQ4NiAxMCAxMCAxMCAxMC00LjQ4NiAxMC0xMFMxNy41MTQgMiAxMiAyem0wIDE4Yy00LjQxMSAwLTgtMy41ODktOC04czMuNTg5LTggOC04IDggMy41ODkgOCA4LTMuNTg5IDgtOCA4eiIvPjxwYXRoIGQ9Ik0xMSAxMWgydjZoLTJ6bTAtNGgydjJoLTJ6Ii8+PC9zdmc+"></img></a>
</p>
<p align="center"><a href="https://mara-li.github.io/obsidian_mkdocs_publisher_docs/">Documentation</a></p>
<p align="center"><a href="https://www.mara-li.fr">Owlly Seed (My Blog ; In French)</a></p>

The plugins can be accessed with a github actions and a Obsidian's plugin or using a pip install and usage.

# Main links
- [Main Repo](https://github.com/Mara-Li/obsidian_mkdocs_publisher)
- [Obsidian Plugin](https://github.com/Mara-Li/obsidian-mkdocs-publisher-plugin/)
- [Python package](https://github.com/Mara-Li/obsidian-mkdocs-publisher-python)
- [Template](https://github.com/Mara-Li/obsidian-mkdocs-publisher-template)
- [Documentation](https://mara-li.github.io/obsidian_mkdocs_publisher_docs/)

# Terminal
## Prerequisites
You need : 
- [Git](https://git-scm.com/) and a [Github Account](https://github.com/)
- [Python](https://www.python.org/)
- Optional *(Windows)*: [Windows Terminal](https://docs.microsoft.com/fr-fr/windows/terminal/)

## TLDR
1. Install / update with `pip install obs2mk --upgrade`
2. Template the blog, clone it and configure the blog. 
3. Configure the script (first run)
4. Add `share: true` in Obsidian's note frontmatter
5. Customize the `category` key in Obsidian's note frontmatter
6. Run the script `obs2mk`

# Github actions & Obsidian's plugin
## TLDR
1. Install the plugins through Obsidian Community or [BRAT](https://github.com/TfTHacker/obsidian42-brat)
2. [Template](https://github.com/Mara-Li/mkdocs_obsidian_template) the blog and configure it 
3. Configure the plugin's options : 
	- Repo name
	- Your github username
	- The github token ([from here](https://github.com/settings/tokens/new?scopes=repo))
	- The share key
4. Add `share: true` in Obsidian's note frontmatter 
5. Customize (or not) the `category` key in Obsidian's note frontmatter. 
6. Run the commands throught the file menu or commands palette.

Read more about the [Github Actions](docs/documentation/obs2mk/github actions.md) and the configuration of the [plugin](docs/documentation/Obsidian mkdocs publisher.md).

# Quick blog installation tutorial
1. Click on [use this template](https://github.com/Mara-Li/mkdocs_obsidian_template/generate)[^1]
2. Use the name of your choice.
3. Click on [code](https://docs.github.com/en/get-started/getting-started-with-git/about-remote-repositories) → SSH ; Copy the link
4. Run (in terminal):
```bash
git clone [[PASTE THE LINK HERE]] publish_blog
pip install obs2mk --upgrade
```

[^1]: You must be connected to copy the template ! You can test locally through clone > https : `git clone https://github.com/Mara-Li/mkdocs_obsidian_template.git` or [with downloading the ZIP](https://github.com/Mara-Li/mkdocs_obsidian_template/archive/refs/heads/main.zip)
