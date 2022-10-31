# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

## [4.5.0](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/4.4.2...4.5.0) (2022-10-31)


### Features

* Adding per-files option for repo & autoclean ([f06712d](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/f06712d68fe26db4348fbd5f8026769e3d353026))


### Bug Fixes

* wrong message when successfully publishing on another repo ([2bf3234](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/2bf3234c93330f9e26aa1f48dab2cfaf6596ae66))

### [4.4.2](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.4.1...4.4.2) (2022-10-20)


### Bug Fixes

* Relative broken links after converting with markdown links ([6981724](https://github.com/ObsidianPublisher/obsidian-github-publisher/commit/6981724ba2d47c9ab90679597da0cf76e056534f)), closes [#37](https://github.com/ObsidianPublisher/obsidian-github-publisher/issues/37)

### [4.4.1](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/4.4.0...4.4.1) (2022-10-19)


### Bug Fixes

* TypeError: Cannot read properties of undefined (reading 'share') ([321bcf1](https://github.com/ObsidianPublisher/obsidian-github-publisher/commit/321bcf1a36034289b579d1a7997db9235981d61a))

## [4.4.0](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/4.3.6...4.4.0) (2022-10-16)


### Features

* adding "moment" for text replacer ([f1dd05a](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/f1dd05a0b6b12422bd63d3b24828b686489658eb))
* support frontmatter's filename when converting wikilinks ([c2dcde7](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/c2dcde7501d67dff3af9442f41ba2857d6d36f14))


### Bug Fixes

* failing silently when branch is master not main ([ccdd7a7](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/ccdd7a7ae761f10056f590eacdb27b6855a72222)), closes [#33](https://github.com/obsidianMkdocs/obsidian-github-publisher/issues/33)
* **relativePath:** if two same folder name, the src generated is false ([06bd9be](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/06bd9beee6edf9d832b38c75b7f91ab0b9d7ff0f)), closes [#32](https://github.com/obsidianMkdocs/obsidian-github-publisher/issues/32)

### [4.3.6](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/4.3.5...4.3.6) (2022-10-01)


### Bug Fixes

* share external modified share file when disabled ([2216ba1](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/2216ba18e612f5d9ae6f171ac9002d319a0888ae))

### [4.3.5](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/4.3.4...4.3.5) (2022-09-29)


### Bug Fixes

* forgot webp files in attachments ([db59358](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/db59358ccac06f90cc4a058fe60f39d729ce7d86))

### [4.3.4](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/4.3.3...4.3.4) (2022-09-21)


### Bug Fixes

* add alt text to get a better name ([fff8280](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/fff8280e5fd4066b536676e2a6b3fc57de352f82))

### [4.3.3](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/4.3.2...4.3.3) (2022-09-21)


### Bug Fixes

* duple in tags + remove tag key in generated keys ([8db3162](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/8db31621672367e2e50b00d829529bca5fe03133))

### [4.3.2](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/4.3.1...4.3.2) (2022-09-20)


### Bug Fixes

* reference at same file return only a point ([457cd8b](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/457cd8bf95894bac026e3dc40cfccd04e6e2478a))

### [4.3.1](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/4.3.0...4.3.1) (2022-09-19)


### Bug Fixes

* Link generation when # block ([5cadc8f](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/5cadc8f32ea2d109f394c2f0da6da551d28a7526))

## [4.3.0](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/4.2.3...4.3.0) (2022-09-19)


### Features

* allow to remove embeds mentionning using removeEmbed frontmatter key ([7edee37](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/7edee37a5eae91caf42f33e43f6ef415c7cd2a24))
* share a file if they are externally modified ([cae032c](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/cae032c600ffab13ddfbf291ec127c41ed5baf85))


### Bug Fixes

* better handling error during merge! ([7870553](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/787055351670bcdc8ae4651fb01a9e5cc12ae5d7))
* boolean around conversion with embed and the rest ([02becaa](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/02becaabd966f01a5fc4e5c40d4718e79598a32d))
* double fileHistory prevent pushing embeds ([e2a30bb](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/e2a30bb3b64bda00f38544c02a06d8f55f2e3732))
* forgot hardbreak settings ([a5a89ac](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/a5a89ac141068b5fe959268f35c9269393cf027c))
* links creation with false & non existant files ([8fa583f](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/8fa583f27a28876485f124c4c9d46dab1aa6de0a))
* relative path for the same folder ([3a4f232](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/3a4f232f6ebf8c3d5e58095cbd4140f7ae9bc5ab))
* remove embedding on embed: false ([7d42abd](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/7d42abd269eacdd18ac68d15d7b646b9f3e99762))
* sourceFrontmatter.attachmentLinks is null ([4e8387e](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/4e8387edccbd7aa84ebb4339f3ec6c9c1c320e49))
* title not found for renaming ([d202df1](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/d202df1b815c05aaa5342000ebafe55c1ed308c6))

### [4.2.3](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/4.2.2...4.2.3) (2022-09-06)


### Bug Fixes

* auto-reference empty ([cd9f49d](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/cd9f49daf9d8fe95b6eb79e2640d81b7ac1b5e5d))

### [4.2.2](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/4.2.1...4.2.2) (2022-09-06)


### Bug Fixes

* dataview tables not converted because of the `\|` for alt ([c2a92c6](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/c2a92c65c724864f343ac2c3773902440121c348))
* image links removed because I again missed up with boolean ([457d035](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/457d0354200888433cc1cd67219b30f356f9c693)), closes [#30](https://github.com/obsidianMkdocs/obsidian-github-publisher/issues/30)

### [4.2.1](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/4.2.0...4.2.1) (2022-09-05)


### Bug Fixes

* allowing to send every file supported by obsidian as attachments ([6353acf](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/6353acf47815b1580f3affc5e58396b9dd286e7a))

## [4.2.0](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/4.1.2...4.2.0) (2022-09-05)


### Features

* add image & embed frontmatter perfile settings ([708b04a](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/708b04a83e897855c7aac6028b481a6756bcfafe))
* add imageLink options ([e087cca](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/e087ccad8fd5f7362e6218015bc4fdd1cac55b34))
* frontmatter key for per file settings ([a49bc98](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/a49bc98fe2bdd335df86f292c1be907c54da5c13))
* send image using metadata value ([f43f16b](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/f43f16bfc2470412d3ba21b06412e61b0a918890)), closes [#28](https://github.com/obsidianMkdocs/obsidian-github-publisher/issues/28)
* use another value than title to generate the filename ([c08a49b](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/c08a49b7f698f59ca7bc67678ae59e4ba2c7b657)), closes [PR#29](https://github.com/obsidianMkdocs/PR/issues/29)


### Bug Fixes

* add support for all files found by obsidian using getFirstLinkpathDest ([42ef09b](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/42ef09bdbf9d8d4070669debc2ce71f402b45170))
* add support for any file supported by obsidian ([d22bc61](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/d22bc61042e3a3b27ff1816d8f0b11cf6f085701))
* crash if dataview not installed ([f7de231](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/f7de231791fb53749238186753752669063cc9c1))
* crash if dataview not installed ([887ed5b](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/887ed5b56c7518c86e5caf7e19c49d6540d5ff09))
* forgot to replaceALL space. Not the first ([198da5a](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/198da5ae2053cc5bac3ccacead36f48c158eb3fd))
* image not shared/embeded also send ([2fcae41](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/2fcae4124f595ab416bf2cf59bd42dc881fc332a))
* in dataview, filename not recognize because of the last `\` ([97b262b](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/97b262b696eef1c0c32e1d5bfe44b51ae516458a))
* overriding dataview in better condition ([97c719b](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/97c719ba1337ca0d500a2fab3795fcfa153de068))
* overriding of hardbreak ([0d2a0e7](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/0d2a0e7fbb38de485e7e92e622e20e49f158bda9))
* space in vault name broke the plugin ([d940069](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/d94006945bc181591e3de34ec4a19843cf1e1086))
* true/false between mdlinks parameters and links ([71dad6f](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/71dad6f149ee179b404f7993eab11086f5fd9b15))


### [4.1.3-1](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/4.1.2...4.1.3-1) (2022-08-29)

### [4.1.3-0](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/4.1.2...4.1.3-0) (2022-08-29)

### [4.1.2](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/4.1.1...4.1.2) (2022-08-29)


### Bug Fixes

* **tags:** exclude either filename AND display links ([17c8da9](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/17c8da95d87d7cc31537cf9c0826594ae3cdf4b6))

### [4.1.1](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/4.0.2...4.1.1) (2022-08-28)


### Features

* field to tags conversion ([f8af7af](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/f8af7afb58e1d5423b89665fd21d313159ae23fa)), closes [#26](https://github.com/obsidianMkdocs/obsidian-github-publisher/issues/26)


### Bug Fixes

* better naming for tags ([91c1930](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/91c193064c1613ef603319ce556d0673a27b9537))
* inlines / previous tags removed if dataview inline field ([d040239](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/d0402392574edabb076c996f34c50419ee7746ac)), closes [#26](https://github.com/obsidianMkdocs/obsidian-github-publisher/issues/26)

## [4.2.0](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/4.0.2...4.2.0) (2022-08-28)


### Features

* field to tags conversion ([f8af7af](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/f8af7afb58e1d5423b89665fd21d313159ae23fa)), closes [#26](https://github.com/obsidianMkdocs/obsidian-github-publisher/issues/26)


### Bug Fixes

* better naming for tags ([91c1930](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/91c193064c1613ef603319ce556d0673a27b9537))
* inlines / previous tags removed if dataview inline field ([d040239](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/d0402392574edabb076c996f34c50419ee7746ac)), closes [#26](https://github.com/obsidianMkdocs/obsidian-github-publisher/issues/26)

## [4.1.0](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/4.0.2...4.1.0) (2022-08-28)


### Features

* field to tags conversion ([f8af7af](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/f8af7afb58e1d5423b89665fd21d313159ae23fa)), closes [#26](https://github.com/obsidianMkdocs/obsidian-github-publisher/issues/26)


### Bug Fixes

* inlines / previous tags removed if dataview inline field ([d040239](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/d0402392574edabb076c996f34c50419ee7746ac)), closes [#26](https://github.com/obsidianMkdocs/obsidian-github-publisher/issues/26)

## [4.1.0-1](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/4.0.2...4.1.0-1) (2022-08-28)


### Features

* field to tags conversion ([f8af7af](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/f8af7afb58e1d5423b89665fd21d313159ae23fa)), closes [#26](https://github.com/obsidianMkdocs/obsidian-github-publisher/issues/26)


### Bug Fixes

* inlines / previous tags removed if dataview inline field ([d040239](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/d0402392574edabb076c996f34c50419ee7746ac)), closes [#26](https://github.com/obsidianMkdocs/obsidian-github-publisher/issues/26)

## [4.1.0-0](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/4.0.2...4.1.0-0) (2022-08-28)


### Features

* field to tags conversion ([f8af7af](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/f8af7afb58e1d5423b89665fd21d313159ae23fa)), closes [#26](https://github.com/obsidianMkdocs/obsidian-github-publisher/issues/26)

### [4.0.2](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/4.0.1...4.0.2) (2022-08-26)


### Bug Fixes

* **inlineTags:** handle the case where is no frontmatter tags in a note ([b75e914](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/b75e9148379601f68c81e95dd01152a7bf742105)), closes [#24](https://github.com/obsidianMkdocs/obsidian-github-publisher/issues/24)

### [4.0.1](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/4.0.0...4.0.1) (2022-08-26)


### Bug Fixes

* addinlinetags removes part of note containing --- (keeping only the first) ([b196bbf](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/b196bbf3288116184b68e751d5841a82b10beae0)), closes [#25](https://github.com/obsidianMkdocs/obsidian-github-publisher/issues/25)
* handle the case where is no inline tags in a note ([99e87be](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/99e87be5e940fc9d847ff8e007bc5160b1076e4e)), closes [#24](https://github.com/obsidianMkdocs/obsidian-github-publisher/issues/24)

## [4.0.0](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/3.17.1...4.0.0) (2022-08-26)

### [3.17.1](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/3.17.0...3.17.1) (2022-08-25)


### Bug Fixes

* forgot language string ([f575cab](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/f575cab712c086ad5f7729e62d3494298a74837e))

## [3.17.0](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/3.16.2...3.17.0) (2022-08-25)


### Features

* add inline tags in tags frontmatter ([54de5ad](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/54de5ad8ab03ee005e9610729c4102ba6780f24d)), closes [#23](https://github.com/obsidianMkdocs/obsidian-github-publisher/issues/23)

### [3.16.2](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/3.16.1...3.16.2) (2022-08-23)


### Bug Fixes

* add some docs directly in settings ([0ca53f2](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/0ca53f2b33e86c98f466712a3149b2f8aa7f78db))

### [3.16.1](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/3.16.0...3.16.1) (2022-08-23)

## [3.16.0](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/3.15.0...3.16.0) (2022-08-23)


### Features

* allow to regex replace some text ([649be97](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/649be978a3466d95b20f4ba2986efcadf695339e))


### Bug Fixes

* in some condition, autoclean can be activated same if the parameters is false ([4e46e02](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/4e46e026fa70625b054257a1efe7f0f7734d88e2))

## [3.15.0](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/3.14.7...3.15.0) (2022-08-12)


### Features

* **i18n:** integrate ru translation ([ff1bfe7](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/ff1bfe71fda50e0cd8e18171a79a2464f18e0450))
* **i18n:** ru translation ([218de5b](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/218de5ba369b0827ab1ed4259efbd4cb423e533b))

### [3.14.7](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/3.14.6...3.14.7) (2022-08-11)


### Bug Fixes

* character not removed when wikilinks are created ([6a175db](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/6a175db4bedb5fd50cae84ad544682d07c6276bd)), closes [#19](https://github.com/obsidianMkdocs/obsidian-github-publisher/issues/19)

### [3.14.6](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/3.14.5...3.14.6) (2022-08-07)


### Bug Fixes

* remove error when DOMException : document is not focused ([6a99c02](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/6a99c02b86cb8e1220de1471062341cac878d327))

### [3.14.5](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/3.14.4...3.14.5) (2022-08-07)


### Bug Fixes

* deleted translation forgotten ([a2835c1](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/a2835c1ddb3229338d9ef8671c6fa7421bb478c8))
* file deleted because fileName != file.name in converted object ([9d77627](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/9d77627a6329546b570d428c2d45ec062ddaa0f5))

### [3.14.5-0](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/3.14.4...3.14.5-0) (2022-08-06)


### Bug Fixes

* deleted translation forgotten ([a2835c1](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/a2835c1ddb3229338d9ef8671c6fa7421bb478c8))

### [3.14.4](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/3.14.3...3.14.4) (2022-08-06)


### Bug Fixes

* adding more check for changing filename to frontmatter title ([3944e88](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/3944e88ade09ede7fd15a9342a7990b1f73fd6ff))

### [3.14.3](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/3.14.2...3.14.3) (2022-08-06)


### Bug Fixes

* hotfix for title file generation ([b86cc34](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/b86cc345043992e897213d8aad5d31723981d1cd))

### [3.14.2](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/3.14.1...3.14.2) (2022-08-06)


### Features

* Add using frontmatter title field for generate filename ([b1bad43](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/b1bad4392e5ecb0a99e999cd1343385d7eee9ca8))


### Bug Fixes

* title wasn't used with frontmatter/fixed folder settings ([1489024](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/1489024efffa0e8cc47221c27941a4215ceaae01))

### [3.14.1](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.11.0-0...3.14.1) (2022-08-05)


### Features

* adding multiple possibility to remove part links ([6e922ee](https://github.com/ObsidianPublisher/obsidian-github-publisher/commit/6e922ee2ea4ef6b93d625bc18c2068b3e338d059))
* dataview queries will now follow path and links parameters ([bf6c181](https://github.com/ObsidianPublisher/obsidian-github-publisher/commit/bf6c181b3e33ddb9872ddeb981c43c9b1ce2ed7d))
* Dataview simple query are not correctly rendered! ([0b7b3c4](https://github.com/ObsidianPublisher/obsidian-github-publisher/commit/0b7b3c461809dc0f7b551c9cbf76309b83a97538))
* **embed:** share embed notes only on "one file" commands ([a8896c6](https://github.com/ObsidianPublisher/obsidian-github-publisher/commit/a8896c61840c82dfd6543e7c79916473a136e316))
* notice log in option to help debugging ([6ec514e](https://github.com/ObsidianPublisher/obsidian-github-publisher/commit/6ec514ef561e34a2f851e3e59cf0929886202a30))
* prevent dataview conversion ([6125340](https://github.com/ObsidianPublisher/obsidian-github-publisher/commit/61253407daa118a88a0c417f9d2efec7f9752579))
* send a link to the clipboard when sharing 1note ([6bff7bd](https://github.com/ObsidianPublisher/obsidian-github-publisher/commit/6bff7bde77101b061e66422a318c1d0c47a5b8a7))
* support of FolderNote with outside+same name strategies ([0d661f3](https://github.com/ObsidianPublisher/obsidian-github-publisher/commit/0d661f32d170df4aa35aaf48e253c2ecbede5306))
* **text:** Hard line break conversion ([398f02c](https://github.com/ObsidianPublisher/obsidian-github-publisher/commit/398f02c5bd1d0bd8675af0337c67c245119b1a6a))
* **translation:** add new variable ([de4b7c1](https://github.com/ObsidianPublisher/obsidian-github-publisher/commit/de4b7c1a2e7cba902021aeacb138c54837fa6a3c))


### Bug Fixes

* adding a way to remove part links (for mkdocs ...) ([16dde85](https://github.com/ObsidianPublisher/obsidian-github-publisher/commit/16dde856df174ec9f707c7de97520544fbc83296))
* **embed:** prevent cycle embed with file historic ([b3b84e2](https://github.com/ObsidianPublisher/obsidian-github-publisher/commit/b3b84e2cd16c2fd7adb1772687cbcca8b238b7b9))
* **translation:** Add deepl minimal translation ([35b7733](https://github.com/ObsidianPublisher/obsidian-github-publisher/commit/35b7733a0bd25bcb7e98693d225fe13311b3bd8f))
* typo broke the plugins ([a977cf9](https://github.com/ObsidianPublisher/obsidian-github-publisher/commit/a977cf960f0f5d730050e1eb16184e2f06e7b2f7))
* **typo:** remove . in extension using obsidian.extension ([3fd3e63](https://github.com/ObsidianPublisher/obsidian-github-publisher/commit/3fd3e636beadfa1b8d7fc2608f00a45e2630f8d0))

## [3.15.0](https://github.com/ObsidianPublisher/obsidian-github-publisher/compare/3.11.0-0...3.15.0) (2022-08-05)


### Features

* adding multiple possibility to remove part links ([6e922ee](https://github.com/ObsidianPublisher/obsidian-github-publisher/commit/6e922ee2ea4ef6b93d625bc18c2068b3e338d059))
* dataview queries will now follow path and links parameters ([bf6c181](https://github.com/ObsidianPublisher/obsidian-github-publisher/commit/bf6c181b3e33ddb9872ddeb981c43c9b1ce2ed7d))
* Dataview simple query are not correctly rendered! ([0b7b3c4](https://github.com/ObsidianPublisher/obsidian-github-publisher/commit/0b7b3c461809dc0f7b551c9cbf76309b83a97538))
* **embed:** share embed notes only on "one file" commands ([a8896c6](https://github.com/ObsidianPublisher/obsidian-github-publisher/commit/a8896c61840c82dfd6543e7c79916473a136e316))
* notice log in option to help debugging ([6ec514e](https://github.com/ObsidianPublisher/obsidian-github-publisher/commit/6ec514ef561e34a2f851e3e59cf0929886202a30))
* prevent dataview conversion ([6125340](https://github.com/ObsidianPublisher/obsidian-github-publisher/commit/61253407daa118a88a0c417f9d2efec7f9752579))
* send a link to the clipboard when sharing 1note ([6bff7bd](https://github.com/ObsidianPublisher/obsidian-github-publisher/commit/6bff7bde77101b061e66422a318c1d0c47a5b8a7))
* support of FolderNote with outside+same name strategies ([0d661f3](https://github.com/ObsidianPublisher/obsidian-github-publisher/commit/0d661f32d170df4aa35aaf48e253c2ecbede5306))
* **text:** Hard line break conversion ([398f02c](https://github.com/ObsidianPublisher/obsidian-github-publisher/commit/398f02c5bd1d0bd8675af0337c67c245119b1a6a))
* **translation:** add new variable ([de4b7c1](https://github.com/ObsidianPublisher/obsidian-github-publisher/commit/de4b7c1a2e7cba902021aeacb138c54837fa6a3c))


### Bug Fixes

* adding a way to remove part links (for mkdocs ...) ([16dde85](https://github.com/ObsidianPublisher/obsidian-github-publisher/commit/16dde856df174ec9f707c7de97520544fbc83296))
* **embed:** prevent cycle embed with file historic ([b3b84e2](https://github.com/ObsidianPublisher/obsidian-github-publisher/commit/b3b84e2cd16c2fd7adb1772687cbcca8b238b7b9))
* **translation:** Add deepl minimal translation ([35b7733](https://github.com/ObsidianPublisher/obsidian-github-publisher/commit/35b7733a0bd25bcb7e98693d225fe13311b3bd8f))
* typo broke the plugins ([a977cf9](https://github.com/ObsidianPublisher/obsidian-github-publisher/commit/a977cf960f0f5d730050e1eb16184e2f06e7b2f7))
* **typo:** remove . in extension using obsidian.extension ([3fd3e63](https://github.com/ObsidianPublisher/obsidian-github-publisher/commit/3fd3e636beadfa1b8d7fc2608f00a45e2630f8d0))

## [3.14.0](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/3.11.0-0...3.14.0) (2022-08-05)


### Features

* adding multiple possibility to remove part links ([6e922ee](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/6e922ee2ea4ef6b93d625bc18c2068b3e338d059))
* dataview queries will now follow path and links parameters ([bf6c181](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/bf6c181b3e33ddb9872ddeb981c43c9b1ce2ed7d))
* Dataview simple query are not correctly rendered! ([0b7b3c4](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/0b7b3c461809dc0f7b551c9cbf76309b83a97538))
* **embed:** share embed notes only on "one file" commands ([a8896c6](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/a8896c61840c82dfd6543e7c79916473a136e316))
* notice log in option to help debugging ([6ec514e](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/6ec514ef561e34a2f851e3e59cf0929886202a30))
* prevent dataview conversion ([6125340](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/61253407daa118a88a0c417f9d2efec7f9752579))
* send a link to the clipboard when sharing 1note ([6bff7bd](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/6bff7bde77101b061e66422a318c1d0c47a5b8a7))
* support of FolderNote with outside+same name strategies ([0d661f3](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/0d661f32d170df4aa35aaf48e253c2ecbede5306))
* **text:** Hard line break conversion ([398f02c](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/398f02c5bd1d0bd8675af0337c67c245119b1a6a))
* **translation:** add new variable ([de4b7c1](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/de4b7c1a2e7cba902021aeacb138c54837fa6a3c))


### Bug Fixes

* adding a way to remove part links (for mkdocs ...) ([16dde85](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/16dde856df174ec9f707c7de97520544fbc83296))
* **embed:** prevent cycle embed with file historic ([b3b84e2](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/b3b84e2cd16c2fd7adb1772687cbcca8b238b7b9))
* **translation:** Add deepl minimal translation ([35b7733](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/35b7733a0bd25bcb7e98693d225fe13311b3bd8f))
* typo broke the plugins ([a977cf9](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/a977cf960f0f5d730050e1eb16184e2f06e7b2f7))
* **typo:** remove . in extension using obsidian.extension ([3fd3e63](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/3fd3e636beadfa1b8d7fc2608f00a45e2630f8d0))

## [3.15.0](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/3.11.0-0...3.15.0) (2022-08-05)


### Features

* adding multiple possibility to remove part links ([6e922ee](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/6e922ee2ea4ef6b93d625bc18c2068b3e338d059))
* dataview queries will now follow path and links parameters ([bf6c181](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/bf6c181b3e33ddb9872ddeb981c43c9b1ce2ed7d))
* Dataview simple query are not correctly rendered! ([0b7b3c4](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/0b7b3c461809dc0f7b551c9cbf76309b83a97538))
* **embed:** share embed notes only on "one file" commands ([a8896c6](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/a8896c61840c82dfd6543e7c79916473a136e316))
* notice log in option to help debugging ([6ec514e](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/6ec514ef561e34a2f851e3e59cf0929886202a30))
* prevent dataview conversion ([6125340](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/61253407daa118a88a0c417f9d2efec7f9752579))
* send a link to the clipboard when sharing 1note ([6bff7bd](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/6bff7bde77101b061e66422a318c1d0c47a5b8a7))
* support of FolderNote with outside+same name strategies ([0d661f3](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/0d661f32d170df4aa35aaf48e253c2ecbede5306))
* **text:** Hard line break conversion ([398f02c](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/398f02c5bd1d0bd8675af0337c67c245119b1a6a))
* **translation:** add new variable ([de4b7c1](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/de4b7c1a2e7cba902021aeacb138c54837fa6a3c))


### Bug Fixes

* adding a way to remove part links (for mkdocs ...) ([16dde85](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/16dde856df174ec9f707c7de97520544fbc83296))
* **embed:** prevent cycle embed with file historic ([b3b84e2](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/b3b84e2cd16c2fd7adb1772687cbcca8b238b7b9))
* **translation:** Add deepl minimal translation ([35b7733](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/35b7733a0bd25bcb7e98693d225fe13311b3bd8f))
* typo broke the plugins ([a977cf9](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/a977cf960f0f5d730050e1eb16184e2f06e7b2f7))
* **typo:** remove . in extension using obsidian.extension ([3fd3e63](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/3fd3e636beadfa1b8d7fc2608f00a45e2630f8d0))

## [3.14.0](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/3.11.0-0...3.14.0) (2022-08-05)


### Features

* adding multiple possibility to remove part links ([6e922ee](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/6e922ee2ea4ef6b93d625bc18c2068b3e338d059))
* dataview queries will now follow path and links parameters ([bf6c181](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/bf6c181b3e33ddb9872ddeb981c43c9b1ce2ed7d))
* Dataview simple query are not correctly rendered! ([0b7b3c4](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/0b7b3c461809dc0f7b551c9cbf76309b83a97538))
* **embed:** share embed notes only on "one file" commands ([a8896c6](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/a8896c61840c82dfd6543e7c79916473a136e316))
* notice log in option to help debugging ([6ec514e](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/6ec514ef561e34a2f851e3e59cf0929886202a30))
* prevent dataview conversion ([6125340](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/61253407daa118a88a0c417f9d2efec7f9752579))
* send a link to the clipboard when sharing 1note ([6bff7bd](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/6bff7bde77101b061e66422a318c1d0c47a5b8a7))
* support of FolderNote with outside+same name strategies ([0d661f3](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/0d661f32d170df4aa35aaf48e253c2ecbede5306))
* **text:** Hard line break conversion ([398f02c](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/398f02c5bd1d0bd8675af0337c67c245119b1a6a))
* **translation:** add new variable ([de4b7c1](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/de4b7c1a2e7cba902021aeacb138c54837fa6a3c))


### Bug Fixes

* adding a way to remove part links (for mkdocs ...) ([16dde85](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/16dde856df174ec9f707c7de97520544fbc83296))
* **embed:** prevent cycle embed with file historic ([b3b84e2](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/b3b84e2cd16c2fd7adb1772687cbcca8b238b7b9))
* **translation:** Add deepl minimal translation ([35b7733](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/35b7733a0bd25bcb7e98693d225fe13311b3bd8f))
* typo broke the plugins ([a977cf9](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/a977cf960f0f5d730050e1eb16184e2f06e7b2f7))
* **typo:** remove . in extension using obsidian.extension ([3fd3e63](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/3fd3e636beadfa1b8d7fc2608f00a45e2630f8d0))

## [3.14.0-8](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/3.11.0-0...3.14.0-8) (2022-07-30)


### Features

* adding multiple possibility to remove part links ([6e922ee](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/6e922ee2ea4ef6b93d625bc18c2068b3e338d059))
* dataview queries will now follow path and links parameters ([bf6c181](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/bf6c181b3e33ddb9872ddeb981c43c9b1ce2ed7d))
* Dataview simple query are not correctly rendered! ([0b7b3c4](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/0b7b3c461809dc0f7b551c9cbf76309b83a97538))
* **embed:** share embed notes only on "one file" commands ([a8896c6](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/a8896c61840c82dfd6543e7c79916473a136e316))
* notice log in option to help debugging ([6ec514e](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/6ec514ef561e34a2f851e3e59cf0929886202a30))
* prevent dataview conversion ([6125340](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/61253407daa118a88a0c417f9d2efec7f9752579))
* send a link to the clipboard when sharing 1note ([6bff7bd](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/6bff7bde77101b061e66422a318c1d0c47a5b8a7))
* support of FolderNote with outside+same name strategies ([0d661f3](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/0d661f32d170df4aa35aaf48e253c2ecbede5306))
* **text:** Hard line break conversion ([398f02c](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/398f02c5bd1d0bd8675af0337c67c245119b1a6a))
* **translation:** add new variable ([de4b7c1](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/de4b7c1a2e7cba902021aeacb138c54837fa6a3c))


### Bug Fixes

* adding a way to remove part links (for mkdocs ...) ([16dde85](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/16dde856df174ec9f707c7de97520544fbc83296))
* **embed:** prevent cycle embed with file historic ([b3b84e2](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/b3b84e2cd16c2fd7adb1772687cbcca8b238b7b9))
* **translation:** Add deepl minimal translation ([35b7733](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/35b7733a0bd25bcb7e98693d225fe13311b3bd8f))
* typo broke the plugins ([a977cf9](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/a977cf960f0f5d730050e1eb16184e2f06e7b2f7))
* **typo:** remove . in extension using obsidian.extension ([3fd3e63](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/3fd3e636beadfa1b8d7fc2608f00a45e2630f8d0))

## [3.14.0-7](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/3.11.0-0...3.14.0-7) (2022-07-29)


### Features

* adding multiple possibility to remove part links ([6e922ee](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/6e922ee2ea4ef6b93d625bc18c2068b3e338d059))
* Dataview simple query are not correctly rendered! ([0b7b3c4](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/0b7b3c461809dc0f7b551c9cbf76309b83a97538))
* **embed:** share embed notes only on "one file" commands ([a8896c6](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/a8896c61840c82dfd6543e7c79916473a136e316))
* notice log in option to help debugging ([6ec514e](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/6ec514ef561e34a2f851e3e59cf0929886202a30))
* prevent dataview conversion ([6125340](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/61253407daa118a88a0c417f9d2efec7f9752579))
* send a link to the clipboard when sharing 1note ([6bff7bd](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/6bff7bde77101b061e66422a318c1d0c47a5b8a7))
* support of FolderNote with outside+same name strategies ([0d661f3](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/0d661f32d170df4aa35aaf48e253c2ecbede5306))
* **text:** Hard line break conversion ([398f02c](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/398f02c5bd1d0bd8675af0337c67c245119b1a6a))
* **translation:** add new variable ([de4b7c1](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/de4b7c1a2e7cba902021aeacb138c54837fa6a3c))


### Bug Fixes

* adding a way to remove part links (for mkdocs ...) ([16dde85](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/16dde856df174ec9f707c7de97520544fbc83296))
* **embed:** prevent cycle embed with file historic ([b3b84e2](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/b3b84e2cd16c2fd7adb1772687cbcca8b238b7b9))
* **translation:** Add deepl minimal translation ([35b7733](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/35b7733a0bd25bcb7e98693d225fe13311b3bd8f))
* typo broke the plugins ([a977cf9](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/a977cf960f0f5d730050e1eb16184e2f06e7b2f7))
* **typo:** remove . in extension using obsidian.extension ([3fd3e63](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/3fd3e636beadfa1b8d7fc2608f00a45e2630f8d0))

## [3.14.0-6](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/3.11.0-0...3.14.0-6) (2022-07-29)


### Features

* adding multiple possibility to remove part links ([6e922ee](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/6e922ee2ea4ef6b93d625bc18c2068b3e338d059))
* Dataview simple query are not correctly rendered! ([0b7b3c4](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/0b7b3c461809dc0f7b551c9cbf76309b83a97538))
* **embed:** share embed notes only on "one file" commands ([a8896c6](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/a8896c61840c82dfd6543e7c79916473a136e316))
* notice log in option to help debugging ([6ec514e](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/6ec514ef561e34a2f851e3e59cf0929886202a30))
* prevent dataview conversion ([6125340](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/61253407daa118a88a0c417f9d2efec7f9752579))
* send a link to the clipboard when sharing 1note ([6bff7bd](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/6bff7bde77101b061e66422a318c1d0c47a5b8a7))
* support of FolderNote with outside+same name strategies ([0d661f3](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/0d661f32d170df4aa35aaf48e253c2ecbede5306))
* **text:** Hard line break conversion ([398f02c](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/398f02c5bd1d0bd8675af0337c67c245119b1a6a))
* **translation:** add new variable ([de4b7c1](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/de4b7c1a2e7cba902021aeacb138c54837fa6a3c))


### Bug Fixes

* adding a way to remove part links (for mkdocs ...) ([16dde85](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/16dde856df174ec9f707c7de97520544fbc83296))
* **embed:** prevent cycle embed with file historic ([b3b84e2](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/b3b84e2cd16c2fd7adb1772687cbcca8b238b7b9))
* **translation:** Add deepl minimal translation ([35b7733](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/35b7733a0bd25bcb7e98693d225fe13311b3bd8f))
* typo broke the plugins ([a977cf9](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/a977cf960f0f5d730050e1eb16184e2f06e7b2f7))
* **typo:** remove . in extension using obsidian.extension ([3fd3e63](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/3fd3e636beadfa1b8d7fc2608f00a45e2630f8d0))

## [3.14.0-5](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/3.11.0-0...3.14.0-5) (2022-07-25)


### Features

* adding multiple possibility to remove part links ([6e922ee](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/6e922ee2ea4ef6b93d625bc18c2068b3e338d059))
* Dataview simple query are not correctly rendered! ([0b7b3c4](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/0b7b3c461809dc0f7b551c9cbf76309b83a97538))
* **embed:** share embed notes only on "one file" commands ([a8896c6](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/a8896c61840c82dfd6543e7c79916473a136e316))
* notice log in option to help debugging ([6ec514e](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/6ec514ef561e34a2f851e3e59cf0929886202a30))
* send a link to the clipboard when sharing 1note ([6bff7bd](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/6bff7bde77101b061e66422a318c1d0c47a5b8a7))
* support of FolderNote with outside+same name strategies ([0d661f3](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/0d661f32d170df4aa35aaf48e253c2ecbede5306))
* **text:** Hard line break conversion ([398f02c](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/398f02c5bd1d0bd8675af0337c67c245119b1a6a))
* **translation:** add new variable ([de4b7c1](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/de4b7c1a2e7cba902021aeacb138c54837fa6a3c))


### Bug Fixes

* adding a way to remove part links (for mkdocs ...) ([16dde85](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/16dde856df174ec9f707c7de97520544fbc83296))
* **embed:** prevent cycle embed with file historic ([b3b84e2](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/b3b84e2cd16c2fd7adb1772687cbcca8b238b7b9))
* **translation:** Add deepl minimal translation ([35b7733](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/35b7733a0bd25bcb7e98693d225fe13311b3bd8f))
* typo broke the plugins ([a977cf9](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/a977cf960f0f5d730050e1eb16184e2f06e7b2f7))
* **typo:** remove . in extension using obsidian.extension ([3fd3e63](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/3fd3e636beadfa1b8d7fc2608f00a45e2630f8d0))

## [3.14.0-4](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/3.11.0-0...3.14.0-4) (2022-07-24)


### Features

* adding multiple possibility to remove part links ([6e922ee](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/6e922ee2ea4ef6b93d625bc18c2068b3e338d059))
* Dataview simple query are not correctly rendered! ([0b7b3c4](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/0b7b3c461809dc0f7b551c9cbf76309b83a97538))
* **embed:** share embed notes only on "one file" commands ([a8896c6](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/a8896c61840c82dfd6543e7c79916473a136e316))
* notice log in option to help debugging ([6ec514e](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/6ec514ef561e34a2f851e3e59cf0929886202a30))
* send a link to the clipboard when sharing 1note ([6bff7bd](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/6bff7bde77101b061e66422a318c1d0c47a5b8a7))
* support of FolderNote with outside+same name strategies ([0d661f3](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/0d661f32d170df4aa35aaf48e253c2ecbede5306))
* **text:** Hard line break conversion ([398f02c](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/398f02c5bd1d0bd8675af0337c67c245119b1a6a))
* **translation:** add new variable ([de4b7c1](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/de4b7c1a2e7cba902021aeacb138c54837fa6a3c))


### Bug Fixes

* adding a way to remove part links (for mkdocs ...) ([16dde85](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/16dde856df174ec9f707c7de97520544fbc83296))
* **embed:** prevent cycle embed with file historic ([b3b84e2](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/b3b84e2cd16c2fd7adb1772687cbcca8b238b7b9))
* **translation:** Add deepl minimal translation ([35b7733](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/35b7733a0bd25bcb7e98693d225fe13311b3bd8f))
* typo broke the plugins ([a977cf9](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/a977cf960f0f5d730050e1eb16184e2f06e7b2f7))
* **typo:** remove . in extension using obsidian.extension ([3fd3e63](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/3fd3e636beadfa1b8d7fc2608f00a45e2630f8d0))

## [3.14.0-3](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/3.11.0-0...3.14.0-3) (2022-07-24)


### Features

* adding multiple possibility to remove part links ([6e922ee](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/6e922ee2ea4ef6b93d625bc18c2068b3e338d059))
* Dataview simple query are not correctly rendered! ([0b7b3c4](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/0b7b3c461809dc0f7b551c9cbf76309b83a97538))
* **embed:** share embed notes only on "one file" commands ([a8896c6](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/a8896c61840c82dfd6543e7c79916473a136e316))
* notice log in option to help debugging ([6ec514e](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/6ec514ef561e34a2f851e3e59cf0929886202a30))
* send a link to the clipboard when sharing 1note ([6bff7bd](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/6bff7bde77101b061e66422a318c1d0c47a5b8a7))
* support of FolderNote with outside+same name strategies ([0d661f3](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/0d661f32d170df4aa35aaf48e253c2ecbede5306))
* **text:** Hard line break conversion ([398f02c](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/398f02c5bd1d0bd8675af0337c67c245119b1a6a))
* **translation:** add new variable ([de4b7c1](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/de4b7c1a2e7cba902021aeacb138c54837fa6a3c))


### Bug Fixes

* adding a way to remove part links (for mkdocs ...) ([16dde85](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/16dde856df174ec9f707c7de97520544fbc83296))
* **embed:** prevent cycle embed with file historic ([b3b84e2](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/b3b84e2cd16c2fd7adb1772687cbcca8b238b7b9))
* **translation:** Add deepl minimal translation ([35b7733](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/35b7733a0bd25bcb7e98693d225fe13311b3bd8f))
* **typo:** remove . in extension using obsidian.extension ([3fd3e63](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/3fd3e636beadfa1b8d7fc2608f00a45e2630f8d0))

## [3.14.0-2](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/3.11.0-0...3.14.0-2) (2022-07-24)


### Features

* adding multiple possibility to remove part links ([6e922ee](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/6e922ee2ea4ef6b93d625bc18c2068b3e338d059))
* Dataview simple query are not correctly rendered! ([0b7b3c4](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/0b7b3c461809dc0f7b551c9cbf76309b83a97538))
* **embed:** share embed notes only on "one file" commands ([a8896c6](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/a8896c61840c82dfd6543e7c79916473a136e316))
* send a link to the clipboard when sharing 1note ([6bff7bd](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/6bff7bde77101b061e66422a318c1d0c47a5b8a7))
* support of FolderNote with outside+same name strategies ([0d661f3](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/0d661f32d170df4aa35aaf48e253c2ecbede5306))
* **text:** Hard line break conversion ([398f02c](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/398f02c5bd1d0bd8675af0337c67c245119b1a6a))
* **translation:** add new variable ([de4b7c1](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/de4b7c1a2e7cba902021aeacb138c54837fa6a3c))


### Bug Fixes

* adding a way to remove part links (for mkdocs ...) ([16dde85](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/16dde856df174ec9f707c7de97520544fbc83296))
* **embed:** prevent cycle embed with file historic ([b3b84e2](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/b3b84e2cd16c2fd7adb1772687cbcca8b238b7b9))
* **translation:** Add deepl minimal translation ([35b7733](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/35b7733a0bd25bcb7e98693d225fe13311b3bd8f))
* **typo:** remove . in extension using obsidian.extension ([3fd3e63](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/3fd3e636beadfa1b8d7fc2608f00a45e2630f8d0))

## [3.14.0-1](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/3.11.0-0...3.14.0-1) (2022-07-20)


### Features

* adding multiple possibility to remove part links ([6e922ee](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/6e922ee2ea4ef6b93d625bc18c2068b3e338d059))
* Dataview simple query are not correctly rendered! ([0b7b3c4](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/0b7b3c461809dc0f7b551c9cbf76309b83a97538))
* **embed:** share embed notes only on "one file" commands ([a8896c6](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/a8896c61840c82dfd6543e7c79916473a136e316))
* send a link to the clipboard when sharing 1note ([6bff7bd](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/6bff7bde77101b061e66422a318c1d0c47a5b8a7))
* support of FolderNote with outside+same name strategies ([0d661f3](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/0d661f32d170df4aa35aaf48e253c2ecbede5306))
* **translation:** add new variable ([de4b7c1](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/de4b7c1a2e7cba902021aeacb138c54837fa6a3c))


### Bug Fixes

* adding a way to remove part links (for mkdocs ...) ([16dde85](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/16dde856df174ec9f707c7de97520544fbc83296))
* **embed:** prevent cycle embed with file historic ([b3b84e2](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/b3b84e2cd16c2fd7adb1772687cbcca8b238b7b9))
* **translation:** Add deepl minimal translation ([35b7733](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/35b7733a0bd25bcb7e98693d225fe13311b3bd8f))
* **typo:** remove . in extension using obsidian.extension ([3fd3e63](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/3fd3e636beadfa1b8d7fc2608f00a45e2630f8d0))

## [3.14.0-0](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/3.11.0-0...3.14.0-0) (2022-07-17)


### Features

* adding multiple possibility to remove part links ([6e922ee](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/6e922ee2ea4ef6b93d625bc18c2068b3e338d059))
* Dataview simple query are now correctly rendered! ([0b7b3c4](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/0b7b3c461809dc0f7b551c9cbf76309b83a97538))
* **embed:** share embed notes only on "one file" commands ([a8896c6](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/a8896c61840c82dfd6543e7c79916473a136e316))
* send a link to the clipboard when sharing 1note ([6bff7bd](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/6bff7bde77101b061e66422a318c1d0c47a5b8a7))
* **translation:** add new variable ([de4b7c1](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/de4b7c1a2e7cba902021aeacb138c54837fa6a3c))


### Bug Fixes

* adding a way to remove part links (for mkdocs ...) ([16dde85](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/16dde856df174ec9f707c7de97520544fbc83296))
* **embed:** prevent cycle embed with file historic ([b3b84e2](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/b3b84e2cd16c2fd7adb1772687cbcca8b238b7b9))
* **translation:** Add deepl minimal translation ([35b7733](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/35b7733a0bd25bcb7e98693d225fe13311b3bd8f))
* **typo:** remove . in extension using obsidian.extension ([3fd3e63](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/3fd3e636beadfa1b8d7fc2608f00a45e2630f8d0))

## [3.13.0](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/3.11.0-0...3.13.0) (2022-07-14)


### Features

* adding multiple possibility to remove part links ([6e922ee](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/6e922ee2ea4ef6b93d625bc18c2068b3e338d059))
* **embed:** share embed notes only on "one file" commands ([a8896c6](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/a8896c61840c82dfd6543e7c79916473a136e316))
* send a link to the clipboard when sharing 1note ([6bff7bd](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/6bff7bde77101b061e66422a318c1d0c47a5b8a7))
* **translation:** add new variable ([de4b7c1](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/de4b7c1a2e7cba902021aeacb138c54837fa6a3c))


### Bug Fixes

* adding a way to remove part links (for mkdocs ...) ([16dde85](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/16dde856df174ec9f707c7de97520544fbc83296))
* **embed:** prevent cycle embed with file historic ([b3b84e2](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/b3b84e2cd16c2fd7adb1772687cbcca8b238b7b9))
* **translation:** Add deepl minimal translation ([35b7733](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/35b7733a0bd25bcb7e98693d225fe13311b3bd8f))
* **typo:** remove . in extension using obsidian.extension ([3fd3e63](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/3fd3e636beadfa1b8d7fc2608f00a45e2630f8d0))

## [3.12.0](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/3.11.0-0...3.12.0) (2022-07-13)


### Features

* **embed:** share embed notes only on "one file" commands ([a8896c6](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/a8896c61840c82dfd6543e7c79916473a136e316))
* **translation:** add new variable ([de4b7c1](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/de4b7c1a2e7cba902021aeacb138c54837fa6a3c))


### Bug Fixes

* **embed:** prevent cycle embed with file historic ([b3b84e2](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/b3b84e2cd16c2fd7adb1772687cbcca8b238b7b9))
* **typo:** remove . in extension using obsidian.extension ([3fd3e63](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/3fd3e636beadfa1b8d7fc2608f00a45e2630f8d0))

## [3.11.0](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/3.11.0-0...3.11.0) (2022-07-13)


### Features

* **embed:** share embed notes only on "one file" commands ([a8896c6](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/a8896c61840c82dfd6543e7c79916473a136e316))
* **translation:** add new variable ([de4b7c1](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/de4b7c1a2e7cba902021aeacb138c54837fa6a3c))


### Bug Fixes

* **embed:** prevent cycle embed with file historic ([b3b84e2](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/b3b84e2cd16c2fd7adb1772687cbcca8b238b7b9))

## [3.11.0-2](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/3.11.0-0...3.11.0-2) (2022-07-11)


### Features

* **embed:** share embed notes only on "one file" commands ([a8896c6](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/a8896c61840c82dfd6543e7c79916473a136e316))


### Bug Fixes

* **embed:** prevent cycle embed with file historic ([b3b84e2](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/b3b84e2cd16c2fd7adb1772687cbcca8b238b7b9))

## [3.11.0-1](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/3.11.0-0...3.11.0-1) (2022-07-10)


### Bug Fixes

* **embed:** prevent cycle embed with file historic ([b3b84e2](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/b3b84e2cd16c2fd7adb1772687cbcca8b238b7b9))

## [3.11.0-0](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/3.10.3-0...3.11.0-0) (2022-07-10)


### Features

* **embed:** Adding specific settings to share embedded notes ([7396d6b](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/7396d6bbdab944a5ce5b1465e5676a4463a674f2))
* **embed:** share embed files too! ([558cc74](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/558cc7474079a7529b1cb5d9ef7d5b919596e194))
* **image:** adding statusbar for shared image ([4c3c57a](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/4c3c57a3194ec13664a9a2603cc3ed6a1426c521))

### [3.10.3-0](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/3.10.2...3.10.3-0) (2022-07-10)

### [3.10.2](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/3.10.2-7...3.10.2) (2022-07-07)


### Bug Fixes

* image path not converted correctly ([627172c](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/627172ccb402191327c6d0321b7a852bee9b953e))

### [3.10.2-7](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/3.10.2-6...3.10.2-7) (2022-07-07)

### [3.10.2-6](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/3.10.2-5...3.10.2-6) (2022-07-07)

### [3.10.2-5](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/3.10.2-4...3.10.2-5) (2022-07-07)

### [3.10.2-4](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/3.10.2-3...3.10.2-4) (2022-07-07)

### [3.10.2-3](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/3.10.2-2...3.10.2-3) (2022-07-07)


### Bug Fixes

* attemps to fix image relative creator ([68a00b8](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/68a00b8a3ee7163ec2a1245f26d0d104d59659a6))
* use alt text for linked files ([1b800cd](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/1b800cd3edf79ed14d33772292a61de1ff763aeb))

### [3.10.2-2](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/3.10.2-1...3.10.2-2) (2022-07-07)

### [3.10.2-1](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/3.10.2-0...3.10.2-1) (2022-07-07)

### [3.10.2-0](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/3.10.0...3.10.2-0) (2022-07-07)

### [3.10.1](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/3.10.0...3.10.1) (2022-07-07)

## [3.10.0](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/3.10.0-5...3.10.0) (2022-07-07)

## [3.10.0-5](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/3.10.0-4...3.10.0-5) (2022-07-05)


### Features

* prevent change links if file not shared ([79b930e](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/79b930e3a6eb59ae90bf0d9f11a197c3424f8ba2))

## [3.10.0-4](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/3.10.0-3...3.10.0-4) (2022-07-05)


### Bug Fixes

* Finally of finally of fixing the trim and length error in yaml. ([96c5dfb](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/96c5dfb135c6f9541425b4eccbfed916e94575b8))

## [3.10.0-3](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/3.10.0-2...3.10.0-3) (2022-07-05)


### Bug Fixes

* finally fix this fucking trim & length error ([16a0763](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/16a07636fb677885cf2dd8ea6f4b012e8b3e346b))

## [3.10.0-2](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/3.10.0-1...3.10.0-2) (2022-07-05)


### Bug Fixes

* Fix trim reading of undefined ([610022c](https://github.com/obsidianMkdocs/obsidian-github-publisher/commit/610022c591195b6cb3839684be8303a86e2f0c6b))

## [3.10.0-1](https://github.com/obsidianMkdocs/obsidian-github-publisher/compare/3.10.0-0...3.10.0-1) (2022-07-05)

## [3.10.0-0](https://github.com/Mara-Li/obsidian-mkdocs-publisher/compare/3.9.3-1...3.10.0-0) (2022-06-28)


### Features

* support of setSection for items ([af6fca3](https://github.com/Mara-Li/obsidian-mkdocs-publisher/commit/af6fca3be4ddc79f1034f26ff71319e6b53f7ad3))

### [3.9.3-1](https://github.com/Mara-Li/obsidian-mkdocs-publisher/compare/3.9.3-0...3.9.3-1) (2022-06-23)

### [3.9.3-0](https://github.com/Mara-Li/obsidian-mkdocs-publisher/compare/3.9.2...3.9.3-0) (2022-06-23)


### Bug Fixes

* use a strict replacement of link ([ac5ae73](https://github.com/Mara-Li/obsidian-mkdocs-publisher/commit/ac5ae734658b86cfa89f35d9be5e1e68bace98d3))

### [3.9.2](https://github.com/Mara-Li/obsidian-mkdocs-publisher/compare/3.9.1...3.9.2) (2022-06-23)


### Bug Fixes

* embed files not converted ([19590d6](https://github.com/Mara-Li/obsidian-mkdocs-publisher/commit/19590d6c0b64a3b7080a89742da5201c5c4a7704))

### [3.9.1](https://github.com/Mara-Li/obsidian-mkdocs-publisher/compare/3.9.0...3.9.1) (2022-06-19)


### Bug Fixes

* crash if branch already exists and plugin take some times to scanning (adding notice) ([0dc7366](https://github.com/Mara-Li/obsidian-mkdocs-publisher/commit/0dc73664049faf0df4ac005af68c623ec7ae23b7))

## [3.9.0](https://github.com/Mara-Li/obsidian-mkdocs-publisher/compare/3.8.3-1...3.9.0) (2022-06-18)


### Features

* adding subfolder sync ([117c200](https://github.com/Mara-Li/obsidian-mkdocs-publisher/commit/117c200977392da117649bb0f02fe1002e817763)), closes [#9](https://github.com/Mara-Li/obsidian-mkdocs-publisher/issues/9)


### Bug Fixes

* crash on empty default path ([89815c2](https://github.com/Mara-Li/obsidian-mkdocs-publisher/commit/89815c2878721718812023afc0229833253eb75c)), closes [#10](https://github.com/Mara-Li/obsidian-mkdocs-publisher/issues/10)

### [3.8.3-1](https://github.com/Mara-Li/obsidian-mkdocs-publisher/compare/3.8.2...3.8.3-1) (2022-06-18)

### [3.8.3-0](https://github.com/Mara-Li/obsidian-mkdocs-publisher/compare/3.8.2...3.8.3-0) (2022-06-18)

### [3.8.2](https://github.com/Mara-Li/obsidian-mkdocs-publisher/compare/3.8.2-0...3.8.2) (2022-06-18)

### [3.8.2-0](https://github.com/Mara-Li/obsidian-mkdocs-publisher/compare/3.8.1...3.8.2-0) (2022-06-18)


### Bug Fixes

* crash with multiple send ([45989ce](https://github.com/Mara-Li/obsidian-mkdocs-publisher/commit/45989ce278669d0024c35c4ac4813f766efe539f))

### [3.8.1](https://github.com/Mara-Li/obsidian-mkdocs-publisher/compare/3.8.0...3.8.1) (2022-06-17)


### Bug Fixes

* **foldernote:** fix not renaming using frontmatter ([bb54447](https://github.com/Mara-Li/obsidian-mkdocs-publisher/commit/bb54447abf1801c1623e444ea651e49ef0e5a49c))

## [3.8.0](https://github.com/Mara-Li/obsidian-mkdocs-publisher/compare/3.7.0...3.8.0) (2022-06-17)


### Features

* Add a command for only edited notes ([a08c157](https://github.com/Mara-Li/obsidian-mkdocs-publisher/commit/a08c157ee4a17fd88ec01b613f9ef4c529f0dac3))
* share new and edited notes ([629296e](https://github.com/Mara-Li/obsidian-mkdocs-publisher/commit/629296ef8fb5ec4f3b1cfb7a865416d20999c953))


### Bug Fixes

* error with checkcallback ([98f8b30](https://github.com/Mara-Li/obsidian-mkdocs-publisher/commit/98f8b3045b287a4170617e851bc122a422a5d026))

## [3.7.0](https://github.com/Mara-Li/obsidian-mkdocs-publisher/compare/3.6.8...3.7.0) (2022-06-17)


### Features

* Adding a command to share only new shared notes ([176f586](https://github.com/Mara-Li/obsidian-mkdocs-publisher/commit/176f586afed36d9b567f42bade9ade4883cfda60))

### [3.6.8](https://github.com/Mara-Li/obsidian-mkdocs-publisher/compare/3.6.7...3.6.8) (2022-06-17)


### Bug Fixes

* index deleted by error using frontmatter settings ([dbcfe2b](https://github.com/Mara-Li/obsidian-mkdocs-publisher/commit/dbcfe2bc3230dbd8b9d53f087cb7e66c11191767))

### [3.6.7](https://github.com/Mara-Li/obsidian-mkdocs-publisher/compare/3.6.6...3.6.7) (2022-06-17)

### [3.6.6](https://github.com/Mara-Li/obsidian-mkdocs-publisher/compare/3.6.5...3.6.6) (2022-06-15)


### Bug Fixes

* fix regex convertor ([ca0e8ff](https://github.com/Mara-Li/obsidian-mkdocs-publisher/commit/ca0e8ff9ae154c3892c6ee05d052b2865dc61293))

### [3.6.5](https://github.com/Mara-Li/obsidian-mkdocs-publisher/compare/3.6.4...3.6.5) (2022-06-15)


### Bug Fixes

* trim whitespace excluding autoclean ([f45ba1b](https://github.com/Mara-Li/obsidian-mkdocs-publisher/commit/f45ba1bd8cfb4c1d7c479e779a683af4f6e0734c))

### [3.6.4](https://github.com/Mara-Li/obsidian-mkdocs-publisher/compare/3.6.3...3.6.4) (2022-06-14)


### Bug Fixes

* relative links and image not converted with wiki to md ([0755d37](https://github.com/Mara-Li/obsidian-mkdocs-publisher/commit/0755d375e672ceeab1a0216e0c9f4bf63ec762f7)), closes [#8](https://github.com/Mara-Li/obsidian-mkdocs-publisher/issues/8)

### [3.6.3](https://github.com/Mara-Li/obsidian-mkdocs-publisher/compare/3.6.2...3.6.3) (2022-06-14)


### Bug Fixes

* **img:** fix image path error ([c51f7b3](https://github.com/Mara-Li/obsidian-mkdocs-publisher/commit/c51f7b3a6df4f586098543fd740434a44edf3267)), closes [#7](https://github.com/Mara-Li/obsidian-mkdocs-publisher/issues/7)

### [3.6.2](https://github.com/Mara-Li/obsidian-mkdocs-publisher/compare/3.6.1...3.6.2) (2022-06-12)


### Bug Fixes

* error using category frontmatter because of metadataCache ([79c2dbe](https://github.com/Mara-Li/obsidian-mkdocs-publisher/commit/79c2dbebbb0c7e00f5d1a2e57144fbcdfaace353))

### [3.6.1](https://github.com/Mara-Li/obsidian-mkdocs-publisher/compare/3.6.0...3.6.1) (2022-06-05)


### Bug Fixes

* Alt text for wikilinks if index.md ([811592b](https://github.com/Mara-Li/obsidian-mkdocs-publisher/commit/811592b18256d3e591e746f280a4e978c4756ef8))

## [3.6.0](https://github.com/Mara-Li/obsidian-mkdocs-publisher/compare/3.5.0...3.6.0) (2022-06-05)


### Features

* Adding internal links converter and wikilinks to mdlinks ([742077a](https://github.com/Mara-Li/obsidian-mkdocs-publisher/commit/742077a61112234aa05234ab7cf888a93a43e0e3))

## [3.5.0](https://github.com/Mara-Li/obsidian-mkdocs-publisher/compare/3.4.0...3.5.0) (2022-06-01)


### Features

* Adding support for folder note ! ([cde9603](https://github.com/Mara-Li/obsidian-mkdocs-publisher/commit/cde96039d7537aa508f0a13967b465a06e3374b1))

## [3.4.0](https://github.com/Mara-Li/obsidian-github-publisher/compare/3.3.1...3.4.0) (2022-05-28)


### Features

* you can now exclude folder path from be deleted ! ([32a9737](https://github.com/Mara-Li/obsidian-github-publisher/commit/32a973728a3eb9d15b3fe195fe186d44597504a5))

### [3.3.1](https://github.com/Mara-Li/obsidian-github-publisher/compare/3.3.0...3.3.1) (2022-05-28)

## [3.3.0](https://github.com/Mara-Li/obsidian-github-publisher/compare/3.2.0...3.3.0) (2022-05-27)


### Features

* use PR + merge + delete branch instead of force push files ([ec8a367](https://github.com/Mara-Li/obsidian-github-publisher/commit/ec8a367f79a322deb9e3494890a1779d1fa5217a))


### Bug Fixes

* fix error with pullrequest & workflow ([af3e25b](https://github.com/Mara-Li/obsidian-github-publisher/commit/af3e25b70cef2f4e779d7cf61bcf1efb17be85f3))

## [3.2.0](https://github.com/Mara-Li/obsidian-mkdocs-publisher-plugin/compare/3.1.0...3.2.0) (2022-05-24)


### Features

* add cleanning command ([a91e0e4](https://github.com/Mara-Li/obsidian-mkdocs-publisher-plugin/commit/a91e0e4088ccba505fe6a1b4de0d4e5e7c02ad32))


### Bug Fixes

* add cleanning command ([a5a0c87](https://github.com/Mara-Li/obsidian-mkdocs-publisher-plugin/commit/a5a0c874db4046407b8f75d829a61e204003422e))

## [3.1.0](https://github.com/Mara-Li/obsidian-mkdocs-publisher/compare/3.0.1...3.1.0) (2022-05-23)


### Features

* adding obsidian path option ([7714ae4](https://github.com/Mara-Li/obsidian-mkdocs-publisher/commit/7714ae42f6f7b8df9800e593987139de1c95a9d1))

### [3.0.1](https://github.com/Mara-Li/obsidian-mkdocs-publisher/compare/3.0.0...3.0.1) (2022-05-23)


### Bug Fixes

* double .yml if .yml in workflow name ([2d8dabc](https://github.com/Mara-Li/obsidian-mkdocs-publisher/commit/2d8dabc7004ff9774986ce9199a8519f2b4e00ad))

## [3.0.0](https://github.com/Mara-Li/obsidian-mkdocs-publisher/compare/2.4.0...3.0.0) (2022-05-23)


### ⚠ BREAKING CHANGES

* Remove the workflow update

### Features

* Universalize the plugin ([837ef71](https://github.com/Mara-Li/obsidian-mkdocs-publisher/commit/837ef710663a2e2eb80613ac4076ffc5d2bb7de8))

## [3.0.0](https://github.com/Mara-Li/obsidian-mkdocs-publisher/compare/2.4.0...3.0.0) (2022-05-23)


### ⚠ BREAKING CHANGES

* Remove the workflow update

### Features

* Universalize the plugin ([837ef71](https://github.com/Mara-Li/obsidian-mkdocs-publisher/commit/837ef710663a2e2eb80613ac4076ffc5d2bb7de8))

## [2.4.0](https://github.com/Mara-Li/obsidian-mkdocs-publisher/compare/2.3.4...2.4.0) (2022-05-18)


### Features

* send a notification when the build workflow is completed ([1808766](https://github.com/Mara-Li/obsidian-mkdocs-publisher/commit/180876642a195e55b7af21fcd28316b7c8ca45dd))

### [2.3.4](https://github.com/Mara-Li/obsidian-mkdocs-publisher/compare/2.3.3...2.3.4) (2022-05-14)

### [2.3.3](https://github.com/Mara-Li/obsidian-mkdocs-publisher-plugin/compare/2.3.2...2.3.3) (2022-05-13)


### Bug Fixes

* **github:** github action delete filename with coma ([b89f153](https://github.com/Mara-Li/obsidian-mkdocs-publisher-plugin/commit/b89f15318638120f6402a9b18b8f5f444071c9e8))

### [2.3.2](https://github.com/Mara-Li/obsidian-mkdocs-publisher/compare/2.3.1...2.3.2) (2022-05-01)


### Bug Fixes

* Trim settings whitespace ([4738991](https://github.com/Mara-Li/obsidian-mkdocs-publisher/commit/4738991823aee63ad1f76834c0ac28204e525e7f)), closes [#4](https://github.com/Mara-Li/obsidian-mkdocs-publisher/issues/4)

### [2.3.2](https://github.com/Mara-Li/obsidian-mkdocs-publisher/compare/2.3.1...2.3.2) (2022-05-01)


### Bug Fixes

* Trim settings whitespace ([4738991](https://github.com/Mara-Li/obsidian-mkdocs-publisher/commit/4738991823aee63ad1f76834c0ac28204e525e7f)), closes [#4](https://github.com/Mara-Li/obsidian-mkdocs-publisher/issues/4)

### [2.3.1](https://github.com/Mara-Li/obsidian-mkdocs-publisher/compare/2.3.0...2.3.1) (2022-04-26)


### Bug Fixes

* **image:** Add catching error + log when reading metadataCache for image ([9250e23](https://github.com/Mara-Li/obsidian-mkdocs-publisher/commit/9250e232e85d7ce413cff2bbab124ba3d0936aae))
* **publish:** Checking file extension during publish ([c44c268](https://github.com/Mara-Li/obsidian-mkdocs-publisher/commit/c44c268bbfb2f38e28f8a196f82ffea1d3d70000))

## [2.3.0](https://github.com/Mara-Li/obsidian-mkdocs-publisher/compare/2.2.4...2.3.0) (2022-04-18)


### Features

* Update notice with repo name ([88ce078](https://github.com/Mara-Li/obsidian-mkdocs-publisher/commit/88ce078766d9de24eb5a7ef3adb46eb2dae7c816))

### [2.2.4](https://github.com/Mara-Li/obsidian-mkdocs-publisher/compare/2.2.3...2.2.4) (2022-04-18)

### [2.2.3](https://github.com/Mara-Li/obsidian-mkdocs-publisher/compare/2.2.2...2.2.3) (2022-04-16)

### [2.2.2](https://github.com/Mara-Li/obsidian-mkdocs-publisher/compare/2.2.1...2.2.2) (2022-04-16)


### Bug Fixes

* Run workflow only on success ([de4f3ce](https://github.com/Mara-Li/obsidian-mkdocs-publisher/commit/de4f3ce971d5ac0fa2f462a5a26d2a55b0319f85))

### [2.2.1](https://github.com/Mara-Li/obsidian-mkdocs-publisher/compare/2.2.0...2.2.1) (2022-04-15)


### Bug Fixes

* File menu/menu editor doesn't active workflow ([8d2ce3e](https://github.com/Mara-Li/obsidian-mkdocs-publisher/commit/8d2ce3e2cf7eacb05c8f1a3313623a03dabbd854))
* If excludedFolder is empty, no file is shared ([f55d950](https://github.com/Mara-Li/obsidian-mkdocs-publisher/commit/f55d950964b8a438a3c29c53f537f0d748e53caf))

## [2.2.0](https://github.com/Mara-Li/obsidian-mkdocs-publication/compare/2.1.0...2.2.0) (2022-04-13)


### Features

*  Adding editor menu option to share file on right click ([b7ed228](https://github.com/Mara-Li/obsidian-mkdocs-publication/commit/b7ed228989bd5cbaaa01ed001e8fb5ae63e8a6ea))

## [2.1.0](https://github.com/Mara-Li/obsidian-mkdocs-publication/compare/2.0.3...2.1.0) (2022-04-13)


### Features

* Adding a command to update obs2mk setting using obsidian ([0496bed](https://github.com/Mara-Li/obsidian-mkdocs-publication/commit/0496bed29843a03afa1a8cdefb482958796dcffb))

### 2.0.3 (2022-04-12)


### Bug Fixes

* Typo ([ddf6591](https://github.com/Mara-Li/obsidian-mkdocs-publisher/commit/ddf6591a5fe0fb00017f67145df5733347990efa))

### 2.0.2 (2022-04-12)

### [2.0.1](https://github.com/Mara-Li/obsidian-mkdocs-publication/compare/2.0.0...2.0.1) (2022-04-11)


### Bug Fixes

* Base64 errors on mobile ([26dbe6d](https://github.com/Mara-Li/obsidian-mkdocs-publication/commit/26dbe6d514f08ddc4ad60ced7d6cce16c14f2142))

## [2.0.0](https://github.com/Mara-Li/obsidian-mkdocs-publication/compare/1.0.3...2.0.0) (2022-04-11)


### ⚠ BREAKING CHANGES

* This change/erase the previous parameters. Also, the plugin need to be deleted from older installation.

### Bug Fixes

* Mobile multiples errors ([5eecb9a](https://github.com/Mara-Li/obsidian-mkdocs-publication/commit/5eecb9a4daa3b67fb1dbb109cd5133ce527ea7f9))


* !ci: Rename plugins ([f8926a3](https://github.com/Mara-Li/obsidian-mkdocs-publication/commit/f8926a335b0a6adb6763c8c61b3bc72766824864))

### [1.0.3](https://github.com/Mara-Li/obsidian-mkdocs-publication/compare/1.0.2...1.0.3) (2022-04-11)


### Bug Fixes

* Fix sharing one file with filemenu ([5e51626](https://github.com/Mara-Li/obsidian-mkdocs-publication/commit/5e51626b98ff0e0f2ade997f9bf54296143c7d09))

### [1.0.2](https://github.com/Mara-Li/obsidian-mkdocs-publication/compare/1.0.1...1.0.2) (2022-04-11)


### Bug Fixes

* Trim whitespace for excluded folder checking ([2a44ab9](https://github.com/Mara-Li/obsidian-mkdocs-publication/commit/2a44ab9b7c97c20eab6f190d59ed6c0a4f0ccb7c))

### [1.0.1](https://github.com/Mara-Li/obsidian-mkdocs-publication/compare/1.0.0...1.0.1) (2022-04-11)


### Bug Fixes

* CheckCallback() and code duplicate; adding //[@ts-ignore](https://github.com/ts-ignore) for sha error ([9c559c8](https://github.com/Mara-Li/obsidian-mkdocs-publication/commit/9c559c8f8ebd7e02f80c2d93f9372deb1cad0f8d))

## [1.0.0](https://github.com/Mara-Li/obsidian-mkdocs-publication/compare/0.0.2...1.0.0) (2022-04-11)

### [0.0.2](https://github.com/Mara-Li/obsidian-mkdocs-publication/compare/0.0.1...0.0.2) (2022-04-11)

### 0.0.1 (2022-04-11)


### Features

* BREAKING CHANGE: It's the first version ([6d77162](https://github.com/Mara-Li/obsidian-mkdocs-publication/commit/6d771624ba91106e95b4ef281749c9fed560a804))


### Bug Fixes

* conflict ([0d72d97](https://github.com/Mara-Li/obsidian-mkdocs-publication/commit/0d72d97817bcdd9a30425139c1a1c50e7165a73f))
* remove style.css ([4c767e0](https://github.com/Mara-Li/obsidian-mkdocs-publication/commit/4c767e0d2c5296d6b958210bb153980185a195cb))
