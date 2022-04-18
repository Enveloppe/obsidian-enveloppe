import {
  App,
  TFile
} from 'obsidian'
import { Base64 } from 'js-base64'
import { MkdocsPublicationSettings } from '../settings'

function arrayBufferToBase64 (buffer: ArrayBuffer) {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return Base64.btoa(binary)
}

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

export { arrayBufferToBase64, disablePublish }
