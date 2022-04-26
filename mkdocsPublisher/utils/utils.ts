import {
  App,
  TFile
} from 'obsidian'
import { MkdocsPublicationSettings } from '../settings'


function disablePublish (app: App, settings: MkdocsPublicationSettings, file:TFile) {
  const fileCache = app.metadataCache.getFileCache(file)
  const meta = fileCache?.frontmatter
  const folderList = settings.ExcludedFolder.split(',').filter(x => x!=='')
  if (meta === undefined) {
    return false
  } else if (folderList.length > 0) {
    for (let i = 0; i < folderList.length; i++) {
      if (file.path.contains(folderList[i].trim())) {
        return false
      }
    }
  }
  return meta[settings.shareKey]
}

export {disablePublish }
