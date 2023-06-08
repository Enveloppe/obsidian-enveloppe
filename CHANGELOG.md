# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [6.1.14](https://github.com/Lisandra-dev/obsidian-github-publisher-ULTRA-DEV/compare/6.1.13...6.1.14) (2023-06-08)

### [6.1.13](https://github.com/Lisandra-dev/obsidian-github-publisher-ULTRA-DEV/compare/6.1.12...6.1.13) (2023-06-08)

### [6.1.12](https://github.com/Lisandra-dev/obsidian-github-publisher-ULTRA-DEV/compare/6.1.11...6.1.12) (2023-06-08)

### [6.1.11](https://github.com/Lisandra-dev/obsidian-github-publisher-ULTRA-DEV/compare/6.1.10...6.1.11) (2023-06-08)

### [6.1.10](https://github.com/Lisandra-dev/obsidian-github-publisher-ULTRA-DEV/compare/6.1.9...6.1.10) (2023-06-08)

### [6.1.9](https://github.com/Lisandra-dev/obsidian-github-publisher-ULTRA-DEV/compare/6.1.8...6.1.9) (2023-06-08)

### [6.1.8](https://github.com/Lisandra-dev/obsidian-github-publisher-ULTRA-DEV/compare/6.1.7...6.1.8) (2023-06-08)

### [6.1.7](https://github.com/Lisandra-dev/obsidian-github-publisher-ULTRA-DEV/compare/6.1.6...6.1.7) (2023-06-08)

### [6.1.6](https://github.com/Lisandra-dev/obsidian-github-publisher-ULTRA-DEV/compare/6.1.5...6.1.6) (2023-06-08)

### [6.1.5](https://github.com/Lisandra-dev/obsidian-github-publisher-ULTRA-DEV/compare/6.1.4...6.1.5) (2023-06-08)

### [6.1.4](https://github.com/Lisandra-dev/obsidian-github-publisher-ULTRA-DEV/compare/6.1.3...6.1.4) (2023-06-08)

### [6.1.3](https://github.com/Lisandra-dev/obsidian-github-publisher-ULTRA-DEV/compare/6.1.2...6.1.3) (2023-06-08)

### [6.1.1](https://github.com/Lisandra-dev/obsidian-github-publisher-ULTRA-DEV/compare/6.1.0...6.1.1) (2023-06-08)

## [6.1.0](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/6.0.1...6.1.0) (2023-06-07)


### Features

* **crypto:** encrypt and decrypt github token ([3098493](https://github.com/ObsidianPublisher/obsidian-github-publisher/commit/309849310c3a984a8301921a726e47b7dad3871a))


### Bug Fixes

* TypeError: settings.github.otherRepo is not iterable ([5a2d248](https://github.com/ObsidianPublisher/obsidian-github-publisher/commit/5a2d2482a2d8284ec4267f33b341995c19acf848)), closes [#156](https://github.com/ObsidianPublisher/obsidian-github-publisher/issues/156)

### [6.0.1](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/6.0.0...6.0.1) (2023-06-05)


### Bug Fixes

* **cmds:** refactor not applied correctly ([5f7fc48](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/5f7fc484d15ad64cfcc6770499a1440e2c07183b)), closes [#155](https://github.com/obsidianMkdocs/obsidian-github-publisher/issues/155)

## [6.0.0](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/5.7.1...6.0.0) (2023-06-01)


### ⚠ BREAKING CHANGES

* **manageOtherRepo:** the settings was renamed : worflow → workflow
migrating was updated accordingly

### Features

* **manageOtherRepo:** Allow to register other repo with github settings ([02d760e](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/02d760ea8f213fb9786c36c8432738481f23112c))


### Bug Fixes

* use AbstractFileByPath in case of error with LinkPathDest ([11fe4cd](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/11fe4cd13b79a8b9846ad3bfbc7fdfee98608329))

### [5.7.1](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/5.7.0...5.7.1) (2023-05-16)


### Bug Fixes

* **menu:** editor menu error in canvas ([da8deb1](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/da8deb1551eb5261eaf67af8a37de6395f854953))

## [5.7.0](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/5.6.0...5.7.0) (2023-04-14)


### Features

* adding rateLimitingcheck when checking repo ([8688ee4](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/8688ee4d943e195ef3fdb9d8bb64135c8cd77258))
* the ratelimit number is the number of note to send ([6bc1a18](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/6bc1a182f38861a1a0cef08f5d613a9479a68912))


### Bug Fixes

* name not exist if branch exists ([10e8b1b](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/10e8b1b607032ba58f46818da5fcebff6688ce14))
* settings not exists in utils ([06a6502](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/06a65025c703dfa1cedc8733b45b2033763f4163))

## [5.6.0](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/5.6.0-2...5.6.0) (2023-04-02)


### Bug Fixes

* crash when category is null/undefined ([26aa974](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/26aa974847371a6b28e00bcf140458f200a5a5b8)), closes [#132](https://github.com/obsidianMkdocs/obsidian-github-publisher/issues/132)

## [5.5.5](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/5.5.4...5.5.5) (2023-04-01)


### Bug Fixes

* remove links in export modals ([6b25986](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/6b259861747e26bc5d78b475228075def41ea85d))

## [5.5.4](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/5.5.3...5.5.4) (2023-04-01)


### Bug Fixes

* export settings doesn't remove repo/user/token ([dbd65f4](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/dbd65f4bf0bbe7169f298ddfe73cfb1172db1be3))

## [5.5.3](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/5.5.2...5.5.3) (2023-03-22)


### Bug Fixes

* null path if empty folder ([b39f6d1](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/b39f6d1df4423fa8e85131982f6f0eaf845fd0af))

## [5.5.2](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/5.5.1...5.5.2) (2023-03-22)


### Bug Fixes

* wrong parsing translation create documentation error in regex ([cf21b43](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/cf21b43637e29ee0d0161ea7c6cd395202e790b3)), closes [#121](https://github.com/obsidianMkdocs/obsidian-github-publisher/issues/121)

## [5.5.1](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/5.5.0...5.5.1) (2023-03-20)


### Bug Fixes

* no value in customCommitMsg ([376c26e](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/376c26eb9b98ecbe00ec9a7f70f4a6d3530796dd))

## [5.5.0](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/5.4.0...5.5.0) (2023-03-19)


### Features

* add msg when copylink with cmd ([a30b922](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/a30b9223d9884e7a80e8351c256fbf7fe7f300d3))


### Bug Fixes

* created link with // or more ([25efb81](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/25efb813ec800df6e3da16112e362fa88c68c344))

## [5.4.0](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/5.4.0-3...5.4.0) (2023-03-19)


### Bug Fixes

* error when file aren't deleted ([7287156](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/728715636206ce6ffe8ddc9142a611a21e64dd87))

## [5.3.4](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/5.3.3...5.3.4) (2023-03-16)


### Bug Fixes

* Path cannot start with a slash ([bef44ec](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/bef44ec75828aeb3ac8e3880010c695a7a2bac20)), closes [#115](https://github.com/obsidianMkdocs/obsidian-github-publisher/issues/115)

## [5.3.3](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/5.3.3-0...5.3.3) (2023-03-14)


### Bug Fixes

* **findAndReplace:** replace regex search ([5630a75](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/5630a75663492c01f055f84989dafc6f90a18acb))

## [5.3.2](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/5.3.1...5.3.2) (2023-03-12)


### Bug Fixes

* wrong link created ([00a2ee7](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/00a2ee7e4582439206bdc3c013aa34087ff06bb3))

## [5.3.1](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/5.3.0...5.3.1) (2023-03-07)


### Bug Fixes

* if dataview can be converted ; return text ([ab62335](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/ab6233599450d2015a40922d95da14d4a4413c8e))
* use object for translation repo ([975252c](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/975252cf0313d386a499f28a64cd4ed1653afcde))

## [5.3.0](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/5.2.3...5.3.0) (2023-03-07)


### Features

* object for copylink ([11b649d](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/11b649db8d17bdbef1f367c99b7d30bcc3420481))


### Bug Fixes

* multipleRepo/Repo problem ([3d7b769](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/3d7b76999ce5a6cfbb7abcec336ec9ea9f4a0158))

## [5.2.3](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/5.2.2...5.2.3) (2023-03-06)


### Bug Fixes

* remove share external modified ([8d891e5](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/8d891e5ccedf2e8c8be4765c2fa07eb92515c1b5))

## [5.2.2](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/5.2.1...5.2.2) (2023-03-05)


### Bug Fixes

* **settings:** workflow endings and value ([da3ff56](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/da3ff562c8f0974c084c117389717023e6e49226))

## [5.2.1](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/5.2.0...5.2.1) (2023-03-04)


### Bug Fixes

* **translation:** statusbar counter-interpolation ([45bb4c7](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/45bb4c7a8a79f363ca68adf0e539357dad48c15f))

## [5.2.0](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/5.1.0...5.2.0) (2023-03-04)


### Features

* **link:** allow creating a cmd to copy link ([c9bd418](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/c9bd4181db278ad86797ef53d2e85d488f4dd89e))

## [5.1.0](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/5.0.2...5.1.0) (2023-03-04)


### Features

* **path:** add path frontmatter key to override settings ([de99d7f](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/de99d7ffbbdf040f3a0a7ce741c1e26a961094b6))

## [5.0.2](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/5.0.1...5.0.2) (2023-02-28)


### Bug Fixes

* **conversion:** remove useless check (as settings are migrated) ([5a5e448](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/5a5e448439e27621ae49a18883ef92c1d142a625))
* **conversion:** unify the text replacement with other regex ([864e26e](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/864e26e9ad980d17ee8adcd32ed8352092e0de79))
* import not found for oldsettings ([06610ce](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/06610ce60e6299ad10ad882c4df042feadace28c))
* **translation:** move censor -> regexReplacing ([9c427e8](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/9c427e832c4ffb01f095020ac90af80a37866455))

## [5.0.1](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/5.0.0...5.0.1) (2023-02-28)


### Bug Fixes

* **translation:** error in template & value ([e62cc1a](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/e62cc1ad1811f19c9201d79bfcdf13c526020e0c))

## [5.0.0](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/5.0.0-13...5.0.0) (2023-02-28)


### Bug Fixes

* import errors ([13963a6](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/13963a6c19658e471e89644118796d14dbd209bb))

## [4.12.0](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/4.12.0-5...4.12.0) (2023-02-05)

<a name="4.11.15rc4"></a>
## [4.11.15rc4](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/v4.11.15rc4...4.11.15rc4) (2023-01-22)


<a name="v4.11.15rc4"></a>
## [v4.11.15rc4](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.11.15rc3...v4.11.15rc4) (2023-01-22)

### Chore

* **bump:** v4.11.15rc4
* **bump:** v4.11.15rc4
* **bump:** v4.11.15rc4

### Docs

* fix mispelled docs

### Reverts

* chore(bump): v4.11.15rc4


<a name="4.11.15rc3"></a>
## [4.11.15rc3](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.11.15rc2...4.11.15rc3) (2023-01-22)

### Chore

* bump manifest
* **bump:** Bump to rc3
* **bump:** Update to RC2
* **bump:** Update to rc2
* **bump:** v4.11.15rc2

### Ci

* create another python release


<a name="4.11.15rc2"></a>
## [4.11.15rc2](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.11.15rc1...4.11.15rc2) (2023-01-21)

### Chore

* **bump:** v4.11.15rc1

### Docs

* forgot to add autoclean into some help


<a name="4.11.15rc1"></a>
## [4.11.15rc1](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.11.15rc...4.11.15rc1) (2023-01-21)

### Ci

* **changelog:** add script to change tag

### Fix

* misbehavior between repo autoclean & index preventing removing


<a name="4.11.15rc"></a>
## [4.11.15rc](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.11.15-0...4.11.15rc) (2023-01-19)


<a name="4.11.15-0"></a>
## [4.11.15-0](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.11.14...4.11.15-0) (2023-01-18)

### Chore

* Bump beta version
* **release:** 4.11.15-0

### Refactor

* optimize octokit


<a name="4.11.14"></a>
## [4.11.14](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.11.13...4.11.14) (2023-01-17)

### Chore

* Bump beta version
* **release:** 4.11.14

### Fix

* private repo error / first loading settings error close [#80](https://github.com/ObsidianPublisher/obsidian-github-publisher/issues/80)


<a name="4.11.13"></a>
## [4.11.13](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.11.12...4.11.13) (2023-01-15)

### Chore

* Bump beta version
* **release:** 4.11.13

### Ci

* **package.json:** remove useless cmds

### Fix

* **fr:** major typo in commands name


<a name="4.11.12"></a>
## [4.11.12](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.11.11...4.11.12) (2023-01-14)

### Chore

* Bump beta version
* **release:** 4.11.12

### Refactor

* Rename "unshared" to "depublished" for more accurate commands description


<a name="4.11.11"></a>
## [4.11.11](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.11.10...4.11.11) (2023-01-14)

### Chore

* Bump beta version
* **release:** 4.11.11

### Refactor

* change commands name


<a name="4.11.10"></a>
## [4.11.10](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.11.9...4.11.10) (2023-01-11)

### Chore

* Bump beta version
* **release:** 4.11.10

### Fix

* internal links alias mis-replaced fix [#72](https://github.com/ObsidianPublisher/obsidian-github-publisher/issues/72)


<a name="4.11.9"></a>
## [4.11.9](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.11.8...4.11.9) (2023-01-10)

### Chore

* Bump beta version
* **release:** 4.11.9

### Fix

* convert to wikilinks revert convert to github path


<a name="4.11.8"></a>
## [4.11.8](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.11.7...4.11.8) (2023-01-10)

### Chore

* Bump beta version
* **release:** 4.11.8

### Fix

* Frontmatter title value is used for filename Reason: Forgot to check the settings before taking the filename see [#69](https://github.com/ObsidianPublisher/obsidian-github-publisher/issues/69) (nice)


<a name="4.11.7"></a>
## [4.11.7](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.11.6...4.11.7) (2023-01-10)

### Chore

* **release:** 4.11.7

### Fix

* convert wikilinks broken when anchor
* misplaced extension on markdown links with anchor to paragraph
* alt-text in markdown-links not saved


<a name="4.11.6"></a>
## [4.11.6](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.11.5...4.11.6) (2023-01-10)

### Chore

* Bump beta version
* **release:** 4.11.6

### Fix

* anchor links bug It's probably the worst code of my life but I'm too bored to check it out.

### Refactor

* optimise markdown links replacer


<a name="4.11.5"></a>
## [4.11.5](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.11.4...4.11.5) (2023-01-09)

### Chore

* Bump beta version
* **release:** 4.11.5

### Fix

* .md not appended on file without heading

### Refactor

* **log:** remove useless logs


<a name="4.11.4"></a>
## [4.11.4](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.11.3...4.11.4) (2023-01-09)

### Chore

* Bump beta version
* **release:** 4.11.4

### Fix

* fix links not converted properly Because of a lot of little error See [#67](https://github.com/ObsidianPublisher/obsidian-github-publisher/issues/67)


<a name="4.11.3"></a>
## [4.11.3](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.11.2...4.11.3) (2023-01-08)

### Chore

* Bump beta version
* **release:** 4.11.3

### Fix

* internal links are not converted in MDlinks see [#68](https://github.com/ObsidianPublisher/obsidian-github-publisher/issues/68)


<a name="4.11.2"></a>
## [4.11.2](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.11.1...4.11.2) (2023-01-05)

### Chore

* **release:** 4.11.2
* **release:** 4.11.1

### Ci

* fix github tag broken when using commit --amend

### Fix

* the plugin try to continue same if no branch are found /created


<a name="4.11.1"></a>
## [4.11.1](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.11.0...4.11.1) (2023-01-04)

### Chore

* **release:** 4.11.1
* **release:** 4.11.0

### Ci

* update commands

### Fix

* adding checking repository in all commands to check the validity & perform the programm


<a name="4.11.0"></a>
## [4.11.0](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.10.2...4.11.0) (2023-01-04)

### Chore

* **release:** 4.11.0
* **release:** 4.10.2
* **release:** 4.10.2

### Docs

* **JSdoc:** add docs for new function to check validity repo

### Feat

* add a button to test the repository validity

### Style

* **eslint:** run eslint with new configuration
* **prettier:** reformat with prettier


<a name="4.10.2"></a>
## [4.10.2](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.10.1...4.10.2) (2023-01-02)

### Chore

* **release:** 4.10.2

### Ci

* adding update to package-lock

### Fix

* **ambulance:** urgent fix because forgot to add .md for filename.


<a name="4.10.1"></a>
## [4.10.1](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.10.0...4.10.1) (2022-12-31)

### Chore

* **release:** 4.10.1

### Ci

* fix name in release

### Fix

* **obsidianPath:** if folder note outside, wrong filepath created


<a name="4.10.0"></a>
## [4.10.0](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.9.2...4.10.0) (2022-12-31)

### Chore

* **release:** 4.10.0
* **release:** 4.9.2

### Feat

* adding a new option that allow to change the name of folder note file

### Fix

* index note not recognized using regex

### Refactor

* **i18n:** improve translation

### Test

* **fixture:** update


<a name="4.9.2"></a>
## [4.9.2](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.9.1...4.9.2) (2022-12-29)

### Chore

* **release:** 4.9.2
* **release:** 4.9.1

### Fix

* remove the regex edition of title from the title key settings


<a name="4.9.1"></a>
## [4.9.1](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.9.0...4.9.1) (2022-12-28)

### Chore

* trying to fix this
* **actions:** Use gh-release instead of actions
* **actions:** trying to fix this fucking things
* **bump:** update manifest-beta
* **release:** 4.9.1

### Fix

* use the filetitle instead of basename for commands menu


<a name="4.9.0"></a>
## [4.9.0](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.8.1...4.9.0) (2022-12-24)

### Chore

* forgot entry points
* fix styles.css created in duplicate when building
* fix release latest not found
* fix conditions
* move style.css to plugin/settings folder
* fix indent on release.yml
* update release.yml file
* update manifest beta
* **actions:** indent again
* **release:** 4.9.0

### Feat

* apply a regex on the filename directly close [#60](https://github.com/ObsidianPublisher/obsidian-github-publisher/issues/60)

### Refactor

* move style.css to plugin/settings folder


<a name="4.8.1"></a>
## [4.8.1](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.8.0...4.8.1) (2022-12-20)

### Chore

* update minify/source map building for easier debug
* **release:** 4.8.1

### Fix

* Uncaught TypeError: Cannot read properties of null (reading 'path')


<a name="4.8.0"></a>
## [4.8.0](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.8.0-8...4.8.0) (2022-12-14)

### Chore

* **release:** 4.8.0
* **release:** 4.8.0-8

### Fix

* adding more info about error


<a name="4.8.0-8"></a>
## [4.8.0-8](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.8.0-7...4.8.0-8) (2022-12-13)

### Chore

* **release:** 4.8.0-8
* **release:** 4.8.0-7

### Fix

* Cannot read properties of undefined (reading 'filter') see [#58](https://github.com/ObsidianPublisher/obsidian-github-publisher/issues/58)


<a name="4.8.0-7"></a>
## [4.8.0-7](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.8.0-6...4.8.0-7) (2022-12-10)

### Chore

* **release:** 4.8.0-7
* **release:** 4.8.0-6

### Fix

* a typo broke every image links It's 3am and I need to sleep for the god sake


<a name="4.8.0-6"></a>
## [4.8.0-6](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.8.0-5...4.8.0-6) (2022-12-09)

### Chore

* **release:** 4.8.0-6
* **release:** 4.8.0-5

### Fix

* better delete message note in commit message

### Refactor

* optimization


<a name="4.8.0-5"></a>
## [4.8.0-5](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.8.0-4...4.8.0-5) (2022-12-08)

### Chore

* **release:** 4.8.0-5
* **release:** 4.8.0-4

### Fix

* if frontmatter title is used, use this as filename for internal links that is not shared
* if frontmatter title is used, use this as altText


<a name="4.8.0-4"></a>
## [4.8.0-4](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.8.0-3...4.8.0-4) (2022-12-08)

### Chore

* **release:** 4.8.0-4
* **release:** 4.8.0-3

### Fix

* alt text using the path in obsidian

### Refactor

* remove useless logg


<a name="4.8.0-3"></a>
## [4.8.0-3](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.8.0-2...4.8.0-3) (2022-12-08)

### Chore

* **release:** 4.8.0-3
* **release:** 4.8.0-2

### Docs

* **help:** add info about new frontmatter key for internals links & non shared internal links
* **i18n:** more info about new options
* **i18n:** add string for new settings

### Feat

* add 2 new frontmatter key for converting internal links
* option to convert internal links pointing to non shared file

### Fix

* keep basename instead of alt text
* internal links converted in some condition, internal links was converted same if the file is not shared TODO: Add an option to control that behavior

### Merge

* fix

### Refactor

* create a function to allow comparative repoFrontmatter[]
* convert repoFrontmatter to repoFrontmatter[] optimization of the plugin

### Style

* prettier


<a name="4.8.0-2"></a>
## [4.8.0-2](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.8.0-1...4.8.0-2) (2022-12-08)

### Chore

* update manifest with funding url
* **release:** 4.8.0-2
* **release:** 4.8.0-1

### Fix

* relative path created for no shared file / file from another repo
* optimize multipleRepo & monoRepo perfile
* prevent convert links when file is not on the same repo


<a name="4.8.0-1"></a>
## [4.8.0-1](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.8.0-0...4.8.0-1) (2022-12-06)

### Chore

* minify main.js
* **bump:** v4.7.0
* **release:** 4.8.0-1
* **release:** 4.8.0-0

### Docs

* document everything for a better dev workflow


<a name="4.8.0-0"></a>
## [4.8.0-0](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.7.0...4.8.0-0) (2022-12-06)

### Chore

* **dep:** update api
* **i18n:** Add translation string for metadataExtractor
* **release:** 4.8.0-0

### Dev

* allow exporting json from MetadataExtractor

### Feat

* send metadata-extractor file


<a name="4.7.0"></a>
## [4.7.0](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.6.4...4.7.0) (2022-12-02)

### Chore

* bump beta version
* **dep:** update dataview api
* **release:** 4.7.0

### Feat

* introduce regex for folder excluded & autocleanup

### Refactor

* adding more info during load logging
* convert string to list & convert old settings to prevent future errors
* use noticeLog for error message


<a name="4.6.4"></a>
## [4.6.4](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.6.3...4.6.4) (2022-12-02)

### Chore

* **release:** 4.6.4

### Fix

* **i18n:** forgot to check if locale translation exists; fix [#53](https://github.com/ObsidianPublisher/obsidian-github-publisher/issues/53)


<a name="4.6.3"></a>
## [4.6.3](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.6.2...4.6.3) (2022-12-01)

### Chore

* **release:** 4.6.3

### Fix

* setting is empty string in an array ⇒ convert to empty array Maybe fix error


<a name="4.6.2"></a>
## [4.6.2](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.6.1...4.6.2) (2022-12-01)

### Chore

* **release:** 4.6.2

### Fix

* **autoCleanUpExcluded:** convert to empty array if emptry string (aka `""`)


<a name="4.6.1"></a>
## [4.6.1](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.6.1-0...4.6.1) (2022-12-01)

### Chore

* **release:** 4.6.1
* **release:** 4.6.1-0


<a name="4.6.1-0"></a>
## [4.6.1-0](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.6.0...4.6.1-0) (2022-12-01)

### Chore

* **release:** 4.6.1-0

### Fix

* add new string in test settings
* **autoCleanUpExcluded:** string to list conversion of settings

### Refactor

* quality of life for list

### Style

* **settings:** remove empty line


<a name="4.6.0"></a>
## [4.6.0](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.6.0-10...4.6.0) (2022-12-01)

### Chore

* **release:** 4.6.0
* **release:** 4.6.0-10


<a name="4.6.0-10"></a>
## [4.6.0-10](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.6.0-9...4.6.0-10) (2022-12-01)

### Chore

* **i18n:** Adding new strings for help
* **release:** 4.6.0-10
* **release:** 4.6.0-9

### Fix

* typo
* **UI:** increase the size for  UI in column


<a name="4.6.0-9"></a>
## [4.6.0-9](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.6.0-8...4.6.0-9) (2022-12-01)

### Chore

* github action with CHANGELOG-beta.md if beta found
* update package.json name
* **release:** 4.6.0-9
* **release:** 4.6.0-8

### Feat

* **UI:** Rework settings UI to use tab!


<a name="4.6.0-8"></a>
## [4.6.0-8](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.6.0-7...4.6.0-8) (2022-11-29)

### Chore

* update github action
* **release:** 4.6.0-8
* **release:** 4.6.0-7

### Fix

* fix package.json missing build run


<a name="4.6.0-7"></a>
## [4.6.0-7](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.6.0-6...4.6.0-7) (2022-11-29)

### Chore

* **release:** 4.6.0-7
* **release:** 4.7.0-2
* **release:** 4.7.0-1
* **release:** 4.7.0-0
* **release:** 4.6.0
* **release:** 4.6.0-7
* **release:** 4.6.0-6

### Feat

* **UI:** Better textArea (bigger) for settings


<a name="4.6.0-6"></a>
## [4.6.0-6](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.6.0-5...4.6.0-6) (2022-11-28)

### Chore

* **release:** 4.6.0-6
* **release:** 4.6.0-5

### Feat

* **regex:** better UI for regex flags

### Fix

* **regex:** add 'gi' as default flags for regex
* **regex:** Prevent flags errors


<a name="4.6.0-5"></a>
## [4.6.0-5](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.6.0-4...4.6.0-5) (2022-11-28)

### Chore

* **release:** 4.6.0-5
* **release:** 4.6.0-4

### Feat

* add flags option for regex replacing close [#51](https://github.com/ObsidianPublisher/obsidian-github-publisher/issues/51), [#52](https://github.com/ObsidianPublisher/obsidian-github-publisher/issues/52)


<a name="4.6.0-4"></a>
## [4.6.0-4](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.6.0-3...4.6.0-4) (2022-11-27)

### Chore

* **release:** 4.6.0-4
* **release:** 4.6.0-3

### Fix

* prevent error in branchName if `.` in it

### Refactor

* refactor translation file


<a name="4.6.0-3"></a>
## [4.6.0-3](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.6.0-2...4.6.0-3) (2022-11-27)

### Chore

* **release:** 4.6.0-3
* **release:** 4.6.0-2

### Feat

* Option for not automatically merging PR Close [#47](https://github.com/ObsidianPublisher/obsidian-github-publisher/issues/47)

### Fix

* remove useless check repo as repo is never an Array
* rework translation
* attemp to fix multiple added status bar fix [#45](https://github.com/ObsidianPublisher/obsidian-github-publisher/issues/45)


<a name="4.6.0-2"></a>
## [4.6.0-2](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.6.0-1...4.6.0-2) (2022-11-26)

### Chore

* **release:** 4.6.0-2
* **release:** 4.6.0-1

### Fix

* prevent array not copyLink if multiple repo are found (use default settings if multiple repo and not baselink)
* adding repoFrontmatter as value
* adding error code if merging / branch error


<a name="4.6.0-1"></a>
## [4.6.0-1](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.6.0-0...4.6.0-1) (2022-11-26)

### Chore

* **release:** 4.6.0-1
* **release:** 4.6.0-0

### Feat

* Adding baselink frontmatter key Allowing to change the baselink for each documents


<a name="4.6.0-0"></a>
## [4.6.0-0](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.5.1...4.6.0-0) (2022-11-17)

### Chore

* **release:** 4.6.0-0

### Feat

* Allow sending file to multiple repo using the key "repo"


<a name="4.5.1"></a>
## [4.5.1](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.5.0...4.5.1) (2022-11-12)

### Chore

* **release:** 4.5.1

### Fix

* in some condition, .md is append on image fix [#39](https://github.com/ObsidianPublisher/obsidian-github-publisher/issues/39)


<a name="4.5.0"></a>
## [4.5.0](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.5.0-2...4.5.0) (2022-10-31)

### Chore

* **release:** 4.5.0
* **release:** 4.5.0-2


<a name="4.5.0-2"></a>
## [4.5.0-2](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.5.0-1...4.5.0-2) (2022-10-25)

### Chore

* **release:** 4.5.0-2
* **release:** 4.5.0-1

### Style

* remove useless log


<a name="4.5.0-1"></a>
## [4.5.0-1](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.5.0-0...4.5.0-1) (2022-10-25)

### Chore

* **release:** 4.5.0-1
* **release:** 4.5.0-0

### Fix

* wrong message when successfully publishing on another repo


<a name="4.5.0-0"></a>
## [4.5.0-0](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.4.2...4.5.0-0) (2022-10-25)

### Chore

* **release:** 4.5.0-0

### Feat

* Adding per-files option for repo & autoclean

### Style

* reformat with prettier


<a name="4.4.2"></a>
## [4.4.2](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.4.1...4.4.2) (2022-10-20)

### Chore

* **release:** 4.4.2

### Fix

* Relative broken links after converting with markdown links fix [#37](https://github.com/ObsidianPublisher/obsidian-github-publisher/issues/37)


<a name="4.4.1"></a>
## [4.4.1](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.4.0...4.4.1) (2022-10-20)

### Chore

* **release:** 4.4.1

### Fix

* TypeError: Cannot read properties of undefined (reading 'share') forgot to return filename if frontmatter doesn't exists


<a name="4.4.0"></a>
## [4.4.0](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.4.0-0...4.4.0) (2022-10-17)

### Chore

* **release:** 4.4.0
* **release:** 4.4.0-0

### Feat

* adding "moment" for text replacer allow to replace before the other replacement and after them

### Pull Requests

* Merge pull request [#36](https://github.com/ObsidianPublisher/obsidian-github-publisher/issues/36) from kurko/add-first-tests


<a name="4.4.0-0"></a>
## [4.4.0-0](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.3.7-0...4.4.0-0) (2022-10-16)

### Chore

* **release:** 4.4.0-0
* **release:** 4.3.7-0

### Feat

* support frontmatter's filename when converting wikilinks

### Pull Requests

* Merge pull request [#35](https://github.com/ObsidianPublisher/obsidian-github-publisher/issues/35) from kurko/support-frontmatter-filename
* Merge pull request [#34](https://github.com/ObsidianPublisher/obsidian-github-publisher/issues/34) from AJAr/codespace-c739


<a name="4.3.7-0"></a>
## [4.3.7-0](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.3.6...4.3.7-0) (2022-10-09)

### Chore

* **i18n:** Update translation for branch
* **release:** 4.3.7-0

### Fix

* failing silently when branch is master not main fix [#33](https://github.com/ObsidianPublisher/obsidian-github-publisher/issues/33)
* **relativePath:** if two same folder name, the src generated is false fix [#32](https://github.com/ObsidianPublisher/obsidian-github-publisher/issues/32)


<a name="4.3.6"></a>
## [4.3.6](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.3.5...4.3.6) (2022-10-01)

### Chore

* **release:** 4.3.6

### Fix

* share external modified share file when disabled


<a name="4.3.5"></a>
## [4.3.5](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.3.4...4.3.5) (2022-09-29)

### Chore

* **release:** 4.3.5

### Fix

* forgot webp files in attachments


<a name="4.3.4"></a>
## [4.3.4](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.3.3...4.3.4) (2022-09-21)

### Chore

* **release:** 4.3.4

### Fix

* add alt text to get a better name (only for wikilinks)

### Perf

* remove uncessary logging
* remove uncessary logging


<a name="4.3.3"></a>
## [4.3.3](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.3.2...4.3.3) (2022-09-21)

### Chore

* **release:** 4.3.3

### Fix

* duple in tags + remove tag key in generated keys


<a name="4.3.2"></a>
## [4.3.2](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.3.1...4.3.2) (2022-09-20)

### Chore

* **release:** 4.3.2

### Fix

* reference at same file return only a point


<a name="4.3.1"></a>
## [4.3.1](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.3.0...4.3.1) (2022-09-19)

### Chore

* vault link
* **release:** 4.3.1

### Fix

* Link generation when # block


<a name="4.3.0"></a>
## [4.3.0](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.3.0-5...4.3.0) (2022-09-19)

### Chore

* remove beta changelog
* **release:** 4.3.0
* **release:** 4.3.0-5


<a name="4.3.0-5"></a>
## [4.3.0-5](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.3.0-4...4.3.0-5) (2022-09-13)

### Chore

* **release:** 4.3.0-5
* **release:** 4.3.0-4

### Fix

* better handling error during merge!
* relative path for the same folder


<a name="4.3.0-4"></a>
## [4.3.0-4](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.3.0-3...4.3.0-4) (2022-09-13)

### Chore

* **release:** 4.3.0-4
* **release:** 4.3.0-3

### Fix

* title not found for renaming send to lowercase to check index folder note


<a name="4.3.0-3"></a>
## [4.3.0-3](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.3.0-2...4.3.0-3) (2022-09-13)

### Chore

* **release:** 4.3.0-3
* **release:** 4.3.0-2

### Docs

* **i18n:** Add string from last version

### Feat

* share a file if they are externally modified


<a name="4.3.0-2"></a>
## [4.3.0-2](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.3.0-1...4.3.0-2) (2022-09-08)

### Chore

* **release:** 4.3.0-2
* **release:** 4.3.0-1

### Fix

* boolean around conversion with embed and the rest
* sourceFrontmatter.attachmentLinks is null


<a name="4.3.0-1"></a>
## [4.3.0-1](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.3.0-0...4.3.0-1) (2022-09-08)

### Chore

* **release:** 4.3.0-1
* **release:** 4.3.0-0

### Docs

* replace "image" to "attachment" because the plugin support every attachments

### Fix

* forgot hardbreak settings
* double fileHistory prevent pushing embeds

### Perf

* replace every attachment check by a function
* remove uncessary logging
* sanity management of frontmatter per files settings


<a name="4.3.0-0"></a>
## [4.3.0-0](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.2.3...4.3.0-0) (2022-09-08)

### Chore

* **release:** 4.3.0-0
* **release:** 4.2.3

### Feat

* allow to remove embeds mentionning using removeEmbed frontmatter key

### Fix

* links creation with false & non existant files
* remove embedding on embed: false

### Perf

* remove uncessary logging


<a name="4.2.3"></a>
## [4.2.3](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.2.2...4.2.3) (2022-09-06)

### Chore

* **release:** 4.2.3
* **release:** 4.2.2

### Fix

* auto-reference empty


<a name="4.2.2"></a>
## [4.2.2](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.2.1...4.2.2) (2022-09-06)

### Chore

* **release:** 4.2.2

### Fix

* image links removed because I again missed up with boolean fix [#30](https://github.com/ObsidianPublisher/obsidian-github-publisher/issues/30)
* dataview tables not converted because of the `\|` for alt

### Perf

* add merge conflic specific notice


<a name="4.2.1"></a>
## [4.2.1](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.2.0...4.2.1) (2022-09-05)

### Chore

* **release:** 4.2.1
* **release:** 4.2.0
* **release:** 4.2.0

### Fix

* allowing to send every file supported by obsidian as attachments


<a name="4.2.0"></a>
## [4.2.0](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.2.0-14...4.2.0) (2022-09-05)

### Chore

* **release:** 4.2.0
* **release:** 4.2.0-14


<a name="4.2.0-14"></a>
## [4.2.0-14](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.2.0-13...4.2.0-14) (2022-09-05)

### Chore

* **release:** 4.2.0-14
* **release:** 4.2.0-13

### Feat

* use another value than title to generate the filename See PR[#29](https://github.com/ObsidianPublisher/obsidian-github-publisher/issues/29)


<a name="4.2.0-13"></a>
## [4.2.0-13](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.2.0-12...4.2.0-13) (2022-09-05)

### Chore

* **release:** 4.2.0-13
* **release:** 4.2.0-12

### Fix

* in dataview, filename not recognize because of the last `\`

### Perf

* remove uncessary log


<a name="4.2.0-12"></a>
## [4.2.0-12](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.2.0-11...4.2.0-12) (2022-09-05)

### Chore

* **release:** 4.2.0-12
* **release:** 4.2.0-11

### Docs

* **i18n:** update translation / docs follow [#28](https://github.com/ObsidianPublisher/obsidian-github-publisher/issues/28)


<a name="4.2.0-11"></a>
## [4.2.0-11](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.2.0-10...4.2.0-11) (2022-09-05)

### Chore

* **release:** 4.2.0-11
* **release:** 4.2.0-10

### Fix

* add support for all files found by obsidian using getFirstLinkpathDest
* add support for any file supported by obsidian


<a name="4.2.0-10"></a>
## [4.2.0-10](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.2.0-9...4.2.0-10) (2022-09-05)

### Chore

* **release:** 4.2.0-10
* **release:** 4.2.0-9

### Feat

* send image using metadata value FR from [#28](https://github.com/ObsidianPublisher/obsidian-github-publisher/issues/28)

### Fix

* crash if dataview not installed
* crash if dataview not installed


<a name="4.2.0-9"></a>
## [4.2.0-9](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.2.0-8...4.2.0-9) (2022-09-05)

### Chore

* **release:** 4.2.0-9
* **release:** 4.2.0-8

### Fix

* forgot to replaceALL space. Not the first

### Perf

* rename class with new plugin name


<a name="4.2.0-8"></a>
## [4.2.0-8](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.2.0-7...4.2.0-8) (2022-09-05)

### Chore

* **release:** 4.2.0-8
* **release:** 4.2.0-7

### Docs

* adding comments for each function

### Fix

* space in vault name broke the plugin


<a name="4.2.0-7"></a>
## [4.2.0-7](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.2.0-6...4.2.0-7) (2022-09-04)

### Chore

* **release:** 4.2.0-7
* **release:** 4.2.0-6

### Fix

* overriding of hardbreak


<a name="4.2.0-6"></a>
## [4.2.0-6](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.2.0-5...4.2.0-6) (2022-09-04)

### Chore

* **release:** 4.2.0-6
* **release:** 4.2.0-5

### Revert

* image not shared/embeded also send


<a name="4.2.0-5"></a>
## [4.2.0-5](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.2.0-4...4.2.0-5) (2022-09-04)

### Chore

* **release:** 4.2.0-5
* **release:** 4.2.0-4

### Fix

* image not shared/embeded also send


<a name="4.2.0-4"></a>
## [4.2.0-4](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.2.0-3...4.2.0-4) (2022-09-04)

### Chore

* **release:** 4.2.0-4
* **release:** 4.2.0-3

### Fix

* overriding dataview in better condition


<a name="4.2.0-3"></a>
## [4.2.0-3](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.2.0-2...4.2.0-3) (2022-09-04)

### Chore

* **release:** 4.2.0-3
* **release:** 4.2.0-2

### Feat

* add imageLink options


<a name="4.2.0-2"></a>
## [4.2.0-2](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.2.0-1...4.2.0-2) (2022-09-04)

### Chore

* **release:** 4.2.0-2
* **release:** 4.2.0-1

### Feat

* add image & embed frontmatter perfile settings


<a name="4.2.0-1"></a>
## [4.2.0-1](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.2.0-0...4.2.0-1) (2022-09-04)

### Chore

* **release:** 4.2.0-1
* **release:** 4.2.0-0

### Fix

* true/false between mdlinks parameters and links


<a name="4.2.0-0"></a>
## [4.2.0-0](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.1.3-1...4.2.0-0) (2022-09-04)

### Chore

* **release:** 4.2.0-0
* **release:** 4.1.3-1

### Feat

* frontmatter key for per file settings


<a name="4.1.3-1"></a>
## [4.1.3-1](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.1.3-0...4.1.3-1) (2022-08-29)

### Chore

* **release:** 4.1.3-1
* **release:** 4.1.3-0

### Docs

* fix french typos


<a name="4.1.3-0"></a>
## [4.1.3-0](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.1.2...4.1.3-0) (2022-08-29)

### Chore

* **release:** 4.1.3-0
* **release:** 4.1.2

### Perf

* adjust performance of tagging ; remove uncessary log


<a name="4.1.2"></a>
## [4.1.2](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.1.1...4.1.2) (2022-08-29)

### Chore

* **release:** 4.1.2
* **release:** 4.1.1

### Fix

* **tags:** exclude either filename AND display links


<a name="4.1.1"></a>
## [4.1.1](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.1.0...4.1.1) (2022-08-29)

### Chore

* **release:** 4.1.1
* **release:** 4.2.0
* **release:** 4.2.0
* **release:** 4.1.0

### Fix

* better naming for tags


<a name="4.1.0"></a>
## [4.1.0](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.1.0-1...4.1.0) (2022-08-28)

### Chore

* **release:** 4.1.0
* **release:** 4.1.0-1


<a name="4.1.0-1"></a>
## [4.1.0-1](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.1.0-0...4.1.0-1) (2022-08-28)

### Chore

* **release:** 4.1.0-1
* **release:** 4.1.0-0

### Fix

* inlines / previous tags removed if dataview inline field close [#26](https://github.com/ObsidianPublisher/obsidian-github-publisher/issues/26)


<a name="4.1.0-0"></a>
## [4.1.0-0](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.0.2...4.1.0-0) (2022-08-28)

### Chore

* **release:** 4.1.0-0

### Feat

* field to tags conversion close [#26](https://github.com/ObsidianPublisher/obsidian-github-publisher/issues/26)


<a name="4.0.2"></a>
## [4.0.2](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.0.1...4.0.2) (2022-08-26)

### Chore

* **release:** 4.0.2
* **release:** 4.0.1

### Fix

* **inlineTags:** handle the case where is no frontmatter tags in a note close: [#24](https://github.com/ObsidianPublisher/obsidian-github-publisher/issues/24) (again)


<a name="4.0.1"></a>
## [4.0.1](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.0.0...4.0.1) (2022-08-26)

### Chore

* **release:** 4.0.1
* **release:** 4.0.0

### Fix

* addinlinetags removes part of note containing --- (keeping only the first) close [#25](https://github.com/ObsidianPublisher/obsidian-github-publisher/issues/25)
* handle the case where is no inline tags in a note close [#24](https://github.com/ObsidianPublisher/obsidian-github-publisher/issues/24)


<a name="4.0.0"></a>
## [4.0.0](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.17.1...4.0.0) (2022-08-26)

### Chore

* **release:** 4.0.0
* **release:** 3.17.1


<a name="3.17.1"></a>
## [3.17.1](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.17.0...3.17.1) (2022-08-25)

### Chore

* **release:** 3.17.1
* **release:** 3.17.0

### Fix

* forgot language string


<a name="3.17.0"></a>
## [3.17.0](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.16.2...3.17.0) (2022-08-25)

### Chore

* lib ES2021 for replaceAll support
* **release:** 3.17.0
* **release:** 3.16.2

### Feat

* add inline tags in tags frontmatter close [#23](https://github.com/ObsidianPublisher/obsidian-github-publisher/issues/23)

### Refactor

* rename class


<a name="3.16.2"></a>
## [3.16.2](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.16.1...3.16.2) (2022-08-23)

### Chore

* **release:** 3.16.2
* **release:** 3.16.1

### Fix

* add some docs directly in settings


<a name="3.16.1"></a>
## [3.16.1](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.16.0...3.16.1) (2022-08-23)

### Chore

* **release:** 3.16.1

### Perf

* list for censor description


<a name="3.16.0"></a>
## [3.16.0](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.15.0...3.16.0) (2022-08-23)

### Chore

* **release:** 3.16.0
* **release:** 3.15.0

### Feat

* allow to regex replace some text

### Fix

* in some condition, autoclean can be activated same if the parameters is false


<a name="3.15.0"></a>
## [3.15.0](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.14.7...3.15.0) (2022-08-12)

### Chore

* **release:** 3.15.0

### Feat

* **i18n:** integrate ru translation
* **i18n:** ru translation

### Pull Requests

* Merge pull request [#20](https://github.com/ObsidianPublisher/obsidian-github-publisher/issues/20) from zyuhel/patch-1


<a name="3.14.7"></a>
## [3.14.7](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.14.6...3.14.7) (2022-08-11)

### Chore

* **release:** 3.14.7
* **release:** 3.14.6

### Fix

* character not removed when wikilinks are created close [#19](https://github.com/ObsidianPublisher/obsidian-github-publisher/issues/19)


<a name="3.14.6"></a>
## [3.14.6](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.14.5...3.14.6) (2022-08-07)

### Chore

* **release:** 3.14.6
* **release:** 3.14.5

### Fix

* remove error when DOMException : document is not focused


<a name="3.14.5"></a>
## [3.14.5](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.14.5-0...3.14.5) (2022-08-07)

### Chore

* **release:** 3.14.5
* **release:** 3.14.5-0

### Docs

* **i18n:** better translation

### Fix

* file deleted because fileName != file.name in converted object

### Refactor

* change filename, optimize interface object


<a name="3.14.5-0"></a>
## [3.14.5-0](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.14.4...3.14.5-0) (2022-08-06)

### Chore

* **release:** 3.14.5-0
* **release:** 3.14.4

### Fix

* deleted translation forgotten


<a name="3.14.4"></a>
## [3.14.4](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.14.3...3.14.4) (2022-08-06)

### Chore

* **release:** 3.14.4
* **release:** 3.14.3

### Fix

* adding more check for changing filename to frontmatter title


<a name="3.14.3"></a>
## [3.14.3](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.14.2...3.14.3) (2022-08-06)

### Chore

* **release:** 3.14.3
* **release:** 3.14.2

### Fix

* hotfix for title file generation


<a name="3.14.2"></a>
## [3.14.2](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.14.1...3.14.2) (2022-08-06)

### Chore

* **release:** 3.14.2
* **release:** 3.14.1

### Feat

* Add using frontmatter title field for generate filename

### Fix

* title wasn't used with frontmatter/fixed folder settings


<a name="3.14.1"></a>
## [3.14.1](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.14.0...3.14.1) (2022-08-05)

### Chore

* **release:** 3.14.1
* **release:** 3.15.0
* **release:** 3.14.0


<a name="3.14.0"></a>
## [3.14.0](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.14.0-8...3.14.0) (2022-08-05)

### Chore

* **release:** 3.14.0
* **release:** 3.15.0
* **release:** 3.14.0
* **release:** 3.14.0-8

### Style

* lint for reading


<a name="3.14.0-8"></a>
## [3.14.0-8](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.14.0-7...3.14.0-8) (2022-07-30)

### Chore

* **release:** 3.14.0-8
* **release:** 3.14.0-7

### Feat

* dataview queries will now follow path and links parameters


<a name="3.14.0-7"></a>
## [3.14.0-7](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.14.0-6...3.14.0-7) (2022-07-30)

### Chore

* **release:** 3.14.0-7
* **release:** 3.14.0-6


<a name="3.14.0-6"></a>
## [3.14.0-6](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.14.0-5...3.14.0-6) (2022-07-30)

### Chore

* **release:** 3.14.0-6
* **release:** 3.14.0-5

### Feat

* prevent dataview conversion


<a name="3.14.0-5"></a>
## [3.14.0-5](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.14.0-4...3.14.0-5) (2022-07-25)

### Chore

* **release:** 3.14.0-5
* **release:** 3.14.0-4

### Refactor

* rename folders
* **i18n:** Update translation

### Style

* **lint:** whitespace linter


<a name="3.14.0-4"></a>
## [3.14.0-4](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.14.0-3...3.14.0-4) (2022-07-24)

### Chore

* **release:** 3.14.0-4
* **release:** 3.14.0-3

### Fix

* typo broke the plugins


<a name="3.14.0-3"></a>
## [3.14.0-3](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.14.0-2...3.14.0-3) (2022-07-24)

### Chore

* **release:** 3.14.0-3
* **release:** 3.14.0-2

### Docs

* typo

### Feat

* notice log in option to help debugging


<a name="3.14.0-2"></a>
## [3.14.0-2](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.14.0-1...3.14.0-2) (2022-07-24)

### Chore

* **release:** 3.14.0-2
* **release:** 3.14.0-1

### Feat

* **text:** Hard line break conversion

### Refactor

* remove unused import


<a name="3.14.0-1"></a>
## [3.14.0-1](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.14.0-0...3.14.0-1) (2022-07-20)

### Chore

* **release:** 3.14.0-1
* **release:** 3.14.0-0

### Feat

* support of FolderNote with outside+same name strategies


<a name="3.14.0-0"></a>
## [3.14.0-0](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.13.0...3.14.0-0) (2022-07-17)

### Chore

* **release:** 3.14.0-0
* **release:** 3.13.0

### Docs

* **typo:** Typo in french translation

### Feat

* Dataview simple query are not correctly rendered!

### Refactor

* move file in another folder


<a name="3.13.0"></a>
## [3.13.0](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.12.0...3.13.0) (2022-07-14)

### Chore

* **release:** 3.13.0
* **release:** 3.12.0

### Docs

* **translation:** update translation

### Feat

* adding multiple possibility to remove part links
* send a link to the clipboard when sharing 1note

### Fix

* adding a way to remove part links (for mkdocs ...)
* **translation:** Add deepl minimal translation


<a name="3.12.0"></a>
## [3.12.0](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.11.0...3.12.0) (2022-07-13)

### Chore

* **release:** 3.12.0
* **release:** 3.11.0

### Fix

* **typo:** remove . in extension using obsidian.extension


<a name="3.11.0"></a>
## [3.11.0](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.11.0-2...3.11.0) (2022-07-13)

### Chore

* **release:** 3.11.0
* **release:** 3.11.0-2

### Docs

* rename fr to frFR
* add docs functions

### Feat

* **translation:** add new variable update translation

### Pull Requests

* Merge pull request [#16](https://github.com/ObsidianPublisher/obsidian-github-publisher/issues/16) from windily-cloud/add-i18n


<a name="3.11.0-2"></a>
## [3.11.0-2](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.11.0-1...3.11.0-2) (2022-07-11)

### Chore

* **release:** 3.11.0-2
* **release:** 3.11.0-1
* **release:** 3.11.0-1

### Feat

* **embed:** share embed notes only on "one file" commands Sharing one note => share all hierarchy for embed notes


<a name="3.11.0-1"></a>
## [3.11.0-1](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.11.0-0...3.11.0-1) (2022-07-10)

### Chore

* bump 3.11.0-0
* **release:** 3.11.0-1

### Fix

* **embed:** prevent cycle embed with file historic


<a name="3.11.0-0"></a>
## [3.11.0-0](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.10.3-0...3.11.0-0) (2022-07-10)

### Chore

* **release:** 3.11.0-0

### Feat

* **embed:** Adding specific settings to share embedded notes
* **embed:** share embed files too!
* **image:** adding statusbar for shared image

### Refactor

* **log:** remove uncessary message notice


<a name="3.10.3-0"></a>
## [3.10.3-0](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.10.2...3.10.3-0) (2022-07-10)

### Chore

* bump 3.10.2
* **release:** 3.10.3-0


<a name="3.10.2"></a>
## [3.10.2](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.10.2-7...3.10.2) (2022-07-07)

### Chore

* **release:** 3.10.2

### Fix

* image path not converted correctly


<a name="3.10.2-7"></a>
## [3.10.2-7](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.10.2-6...3.10.2-7) (2022-07-07)

### Beta

* add new new logging event to check crash

### Chore

* **release:** 3.10.2-7


<a name="3.10.2-6"></a>
## [3.10.2-6](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.10.2-5...3.10.2-6) (2022-07-07)

### Beta

* added new logging event

### Chore

* **release:** 3.10.2-6


<a name="3.10.2-5"></a>
## [3.10.2-5](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.10.2-4...3.10.2-5) (2022-07-07)

### Beta

* logging event of merging

### Build

* update node version

### Chore

* **release:** 3.10.2-5


<a name="3.10.2-4"></a>
## [3.10.2-4](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.10.2-3...3.10.2-4) (2022-07-07)

### Beta

* attemps fixing link, logging with notice for Ipad

### Chore

* **release:** 3.10.2-4


<a name="3.10.2-3"></a>
## [3.10.2-3](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.10.2-2...3.10.2-3) (2022-07-07)

### Chore

* **release:** 3.10.2-3

### Fix

* use alt text for linked files
* attemps to fix image relative creator


<a name="3.10.2-2"></a>
## [3.10.2-2](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.10.2-1...3.10.2-2) (2022-07-07)

### Build

* log notice

### Chore

* **release:** 3.10.2-2


<a name="3.10.2-1"></a>
## [3.10.2-1](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.10.2-0...3.10.2-1) (2022-07-07)

### Chore

* **release:** 3.10.2-1


<a name="3.10.2-0"></a>
## [3.10.2-0](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.10.1...3.10.2-0) (2022-07-07)

### Chore

* **release:** 3.10.2-0
* **release:** 3.10.1


<a name="3.10.1"></a>
## [3.10.1](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.10.0...3.10.1) (2022-07-07)

### Chore

* invert manifest revert: minappversion for non insider
* **release:** 3.10.1


<a name="3.10.0"></a>
## [3.10.0](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.10.0-5...3.10.0) (2022-07-07)

### Chore

* **release:** 3.10.0


<a name="3.10.0-5"></a>
## [3.10.0-5](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.10.0-4...3.10.0-5) (2022-07-05)

### Chore

* **release:** 3.10.0-5

### Feat

* prevent change links if file not shared


<a name="3.10.0-4"></a>
## [3.10.0-4](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.10.0-3...3.10.0-4) (2022-07-05)

### Chore

* **release:** 3.10.0-4

### Fix

* Finally of finally of fixing the trim and length error in yaml.


<a name="3.10.0-3"></a>
## [3.10.0-3](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.10.0-2...3.10.0-3) (2022-07-05)

### Chore

* **release:** 3.10.0-3

### Fix

* finally fix this fucking trim & length error


<a name="3.10.0-2"></a>
## [3.10.0-2](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.10.0-1...3.10.0-2) (2022-07-05)

### Build

* package.json update

### Chore

* **release:** 3.10.0-2

### Fix

* Fix trim reading of undefined


<a name="3.10.0-1"></a>
## [3.10.0-1](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.10.0-0...3.10.0-1) (2022-07-05)

### Chore

* **release:** 3.10.0-1


<a name="3.10.0-0"></a>
## [3.10.0-0](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.9.3-1...3.10.0-0) (2022-06-28)

### Build

* update dependencies

### Chore

* **release:** 3.10.0-0

### Feat

* support of setSection for items only for obsidian 15.3


<a name="3.9.3-1"></a>
## [3.9.3-1](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.9.3-0...3.9.3-1) (2022-06-23)

### Chore

* **release:** 3.9.3-1

### Docs

* adding links
* update issue template

### Style

* the best debug method is console.log Change my mind!


<a name="3.9.3-0"></a>
## [3.9.3-0](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.9.2...3.9.3-0) (2022-06-23)

### Chore

* **release:** 3.9.3-0

### Fix

* use a strict replacement of link


<a name="3.9.2"></a>
## [3.9.2](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.9.1...3.9.2) (2022-06-23)

### Chore

* **release:** 3.9.2

### Fix

* embed files not converted regex hell


<a name="3.9.1"></a>
## [3.9.1](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.9.0...3.9.1) (2022-06-21)

### Chore

* **issue:** update form
* **release:** 3.9.1
* **release:** 3.9.1

### Fix

* regex lookbehind / ahead crash on ios Thanks Silver!
* crash if branch already exists and plugin take some times to scanning (adding notice)

### Revert

* version error

### Style

* semicolon


<a name="3.9.0"></a>
## [3.9.0](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.8.3-1...3.9.0) (2022-06-18)

### Chore

* **release:** 3.9.0

### Feat

* adding subfolder sync close [#9](https://github.com/ObsidianPublisher/obsidian-github-publisher/issues/9)

### Fix

* crash on empty default path close [#10](https://github.com/ObsidianPublisher/obsidian-github-publisher/issues/10)

### Refactor

* use enum for folderRecept Settings

### Style

* add comments for reading help


<a name="3.8.3-1"></a>
## [3.8.3-1](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.8.3-0...3.8.3-1) (2022-06-18)

### Chore

* **release:** 3.8.3-1
* **release:** 3.8.3-0

### Perf

* **merge:** allow squash merging methods


<a name="3.8.3-0"></a>
## [3.8.3-0](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.8.2...3.8.3-0) (2022-06-18)

### Chore

* **release:** 3.8.3-0
* **release:** 3.8.2

### Perf

* remove log error about non existing image


<a name="3.8.2"></a>
## [3.8.2](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.8.2-0...3.8.2) (2022-06-18)

### Chore

* **release:** 3.8.2
* **release:** 3.8.2-0


<a name="3.8.2-0"></a>
## [3.8.2-0](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.8.1...3.8.2-0) (2022-06-18)

### Chore

* **build:** add beta
* **release:** 3.8.2-0
* **release:** 3.8.3
* **release:** 3.8.3-0
* **release:** 3.8.2
* **release:** 3.8.2

### Fix

* crash with multiple send

### Perf

* remove console.log

### Reverts

* chore(release): 3.8.2


<a name="3.8.1"></a>
## [3.8.1](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.8.0...3.8.1) (2022-06-17)

### Chore

* **release:** 3.8.1

### Fix

* **foldernote:** fix not renaming using frontmatter I forgot an option...


<a name="3.8.0"></a>
## [3.8.0](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.7.0...3.8.0) (2022-06-17)

### Chore

* **release:** 3.8.0

### Feat

* Add a command for only edited notes
* share new and edited notes

### Fix

* error with checkcallback use callback with async

### Refactor

* rename class & functions
* remove unused files


<a name="3.7.0"></a>
## [3.7.0](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.6.8...3.7.0) (2022-06-17)

### Chore

* **release:** 3.7.0

### Feat

* Adding a command to share only new shared notes

### Refactor

* refactor all commands


<a name="3.6.8"></a>
## [3.6.8](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.6.7...3.6.8) (2022-06-17)

### Chore

* **release:** 3.6.8

### Fix

* index deleted by error using frontmatter settings


<a name="3.6.7"></a>
## [3.6.7](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.6.6...3.6.7) (2022-06-17)

### Chore

* **release:** 3.6.7

### Perf

* fix matchedlink not iterable


<a name="3.6.6"></a>
## [3.6.6](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.6.5...3.6.6) (2022-06-15)

### Chore

* **release:** 3.6.6

### Fix

* fix regex convertor note: regex hell

### Perf

* ignore error if file not exists
* adding support for auto-deleting branch from pr (github options)

### Refactor

* remove useless console.log
* **merge:** adding a specific commit title for merging PR Now, all merging are prepend by [PUBLISHER] Merge #nb_pr


<a name="3.6.5"></a>
## [3.6.5](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.6.4...3.6.5) (2022-06-15)

### Chore

* **release:** 3.6.5

### Fix

* trim whitespace excluding autoclean


<a name="3.6.4"></a>
## [3.6.4](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.6.3...3.6.4) (2022-06-14)

### Chore

* **release:** 3.6.4

### Fix

* relative links and image not converted with wiki to md close [#8](https://github.com/ObsidianPublisher/obsidian-github-publisher/issues/8)


<a name="3.6.3"></a>
## [3.6.3](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.6.2...3.6.3) (2022-06-14)

### Chore

* **release:** 3.6.3

### Fix

* **img:** fix image path error Close [#7](https://github.com/ObsidianPublisher/obsidian-github-publisher/issues/7)


<a name="3.6.2"></a>
## [3.6.2](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.6.1...3.6.2) (2022-06-12)

### Chore

* **release:** 3.6.2

### Fix

* error using category frontmatter because of metadataCache

### Refactor

* remove useless console.log
* delete branch if already exists
* **delete:** check frontmatter of index file prevent deleting index created outside Obsidian using frontmatter keys


<a name="3.6.1"></a>
## [3.6.1](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.6.0...3.6.1) (2022-06-05)

### Chore

* **release:** 3.6.1

### Fix

* Alt text for wikilinks if index.md


<a name="3.6.0"></a>
## [3.6.0](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.5.0...3.6.0) (2022-06-05)

### Chore

* **release:** 3.6.0

### Feat

* Adding internal links converter and wikilinks to mdlinks

### Refactor

* Refactor settings for better comprehension
* Renaming function
* Create a function to create path for github


<a name="3.5.0"></a>
## [3.5.0](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.4.0...3.5.0) (2022-06-01)

### Chore

* **release:** 3.5.0

### Feat

* Adding support for folder note !


<a name="3.4.0"></a>
## [3.4.0](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.3.1...3.4.0) (2022-05-29)

### Chore

* **release:** 3.4.0

### Feat

* you can now exclude folder path from be deleted !


<a name="3.3.1"></a>
## [3.3.1](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.3.0...3.3.1) (2022-05-28)

### Chore

* **release:** 3.3.1

### Style

* remove useless console.log


<a name="3.3.0"></a>
## [3.3.0](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.2.0...3.3.0) (2022-05-28)

### Chore

* **release:** 3.3.0

### Feat

* use PR + merge + delete branch instead of force push files

### Fix

* fix error with pullrequest & workflow

### Refactor

* refactor files & cleanning


<a name="3.2.0"></a>
## [3.2.0](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.1.0...3.2.0) (2022-05-24)

### Chore

* **release:** 3.2.0

### Feat

* add cleanning command

### Fix

* add cleanning command => run clean when push /

### Refactor

* toggle move in function of the settings for folder

### Style

* correct indent


<a name="3.1.0"></a>
## [3.1.0](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.0.1...3.1.0) (2022-05-24)

### Chore

* **release:** 3.1.0

### Feat

* adding obsidian path option

### Perf

* Remove padding & border from hidden settings

### Refactor

* Adding noticeMessage for workflow
* adding noticeMessage for workflow

### Style

* eslint
* eslint
* adding lint indentation


<a name="3.0.1"></a>
## [3.0.1](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.0.0...3.0.1) (2022-05-23)

### Chore

* **release:** 3.0.1

### Fix

* double .yml if .yml in workflow name


<a name="3.0.0"></a>
## [3.0.0](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/2.4.0...3.0.0) (2022-05-23)

### Chore

* **release:** 3.0.0
* **release:** 3.0.0

### Feat

* Universalize the plugin

### Pull Requests

* Merge pull request [#5](https://github.com/ObsidianPublisher/obsidian-github-publisher/issues/5) from Mara-Li/Publisher

### BREAKING CHANGE


Remove the workflow update


<a name="2.4.0"></a>
## [2.4.0](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/2.3.4...2.4.0) (2022-05-18)

### Chore

* **release:** 2.4.0

### Feat

* send a notification when the build workflow is completed


<a name="2.3.4"></a>
## [2.3.4](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/2.3.3...2.3.4) (2022-05-14)

### Chore

* **release:** 2.3.4

### Refactor

* remove json log


<a name="2.3.3"></a>
## [2.3.3](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/2.3.2...2.3.3) (2022-05-13)

### Chore

* **release:** 2.3.3

### Fix

* **github:** github action delete filename with coma Change vault_published.txt to json


<a name="2.3.2"></a>
## [2.3.2](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/2.3.1...2.3.2) (2022-05-01)

### Chore

* **release:** 2.3.2
* **release:** 2.3.4
* **release:** 2.3.3
* **release:** 2.3.2

### Fix

* Trim settings whitespace See [#4](https://github.com/ObsidianPublisher/obsidian-github-publisher/issues/4)

### Revert

* Revert wrong version number
* Revert wrong version number


<a name="2.3.1"></a>
## [2.3.1](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/2.3.0...2.3.1) (2022-04-26)

### Build

* **obsidian:** Update Obsidian API

### Chore

* **release:** 2.3.1

### Fix

* **image:** Add catching error + log when reading metadataCache for image
* **publish:** Checking file extension during publish

### Refactor

* Use setText instead of innerText
* Remove arrayBufferToBase64 and use api


<a name="2.3.0"></a>
## [2.3.0](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/2.2.4...2.3.0) (2022-04-18)

### Chore

* **release:** 2.3.0

### Feat

* Update notice with repo name


<a name="2.2.4"></a>
## [2.2.4](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/2.2.3...2.2.4) (2022-04-18)

### Chore

* **release:** 2.2.4

### Refactor

* Rename variable for convention

### Pull Requests

* Merge pull request [#3](https://github.com/ObsidianPublisher/obsidian-github-publisher/issues/3) from Mara-Li/repo-sync/obsidian_mkdocs_publisher_docs/default
* Merge pull request [#2](https://github.com/ObsidianPublisher/obsidian-github-publisher/issues/2) from Mara-Li/repo-sync/obsidian_mkdocs_publisher_docs/default


<a name="2.2.3"></a>
## [2.2.3](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/2.2.2...2.2.3) (2022-04-16)

### Chore

* **release:** 2.2.3
* **release:** 2.2.3

### Refactor

* Remove useless error
* Remove useless console.log ; error on console.error instead of log

### Reverts

* chore(release): 2.2.3


<a name="2.2.2"></a>
## [2.2.2](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/2.2.1...2.2.2) (2022-04-16)

### Chore

* **release:** 2.2.2

### Fix

* Run workflow only on success


<a name="2.2.1"></a>
## [2.2.1](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/2.2.0...2.2.1) (2022-04-16)

### Chore

* **release:** 2.2.1

### Fix

* File menu/menu editor doesn't active workflow
* If excludedFolder is empty, no file is shared


<a name="2.2.0"></a>
## [2.2.0](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/2.1.0...2.2.0) (2022-04-13)

### Chore

* **release:** 2.2.0

### Feat

*  Adding editor menu option to share file on right click

### Style

* Use eslinter


<a name="2.1.0"></a>
## [2.1.0](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/2.0.3...2.1.0) (2022-04-13)

### Chore

* **release:** 2.1.0

### Ci

* match id & use get latest tag action

### Docs

* Adding the docs about the commands "update setting workflow"
* Adding template issue

### Feat

* Adding a command to update obs2mk setting using obsidian

### Refactor

* Change folder and move files


<a name="2.0.3"></a>
## [2.0.3](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/2.0.2...2.0.3) (2022-04-12)

### CI

* manuall release

### Chore

* **release:** 2.0.3

### Fix

* Typo


<a name="2.0.2"></a>
## [2.0.2](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/2.0.1...2.0.2) (2022-04-12)

### Chore

* **release:** 2.0.2

### Ci

* fix name
* Create a manually workflow for quick update

### Docs

* typo
* update token

### Fix

* Optimize with regex image extension  search
* Update generating token link


<a name="2.0.1"></a>
## [2.0.1](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/2.0.0...2.0.1) (2022-04-12)

### Chore

* **release:** 2.0.1

### Docs

* Typo

### Fix

* Base64 errors on mobile


<a name="2.0.0"></a>
## [2.0.0](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/1.0.3...2.0.0) (2022-04-11)

### Chore

* **release:** 2.0.0

### Ci

* Reinstall standard version
* Fix building

### Fix

* Mobile multiples errors

### Test

*  some testing to debug mobile


<a name="1.0.3"></a>
## [1.0.3](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/1.0.2...1.0.3) (2022-04-11)

### Chore

* **release:** 1.0.3

### Fix

* Fix sharing one file with filemenu


<a name="1.0.2"></a>
## [1.0.2](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/1.0.1...1.0.2) (2022-04-11)

### Chore

* **release:** 1.0.2

### Docs

* **readme:** Adding credit + some useful plugins

### Fix

* Trim whitespace for excluded folder checking


<a name="1.0.1"></a>
## [1.0.1](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/1.0.0...1.0.1) (2022-04-11)

### Chore

* **release:** 1.0.1

### Fix

* CheckCallback() and code duplicate; adding //[@ts](https://github.com/ts)-ignore for sha error


<a name="1.0.0"></a>
## 1.0.0 (2022-04-11)

### Chore

* **release:** 1.0.0
* **release:** 0.0.2
* **release:** 0.0.1

### Docs

* Adding LICENSE
* fix gif
* adding metacopy & limitation info
* add README

### Feat

* BREAKING CHANGE: It's the first version

### Fix

* conflict
* remove style.css

### Refactor

* Adding file and hierarchy
