export const app = {
  vault: {
    getMarkdownFiles: jest.fn(),
    getAbstractFileByPath: jest.fn(),
    create: jest.fn(),
    createFolder: jest.fn(),
    createBinary: jest.fn(),
    readBinary: jest.fn(),
    read: jest.fn(),
    modify: jest.fn(),
    modifyBinary: jest.fn(),
    trash: jest.fn(),
    adapter: {
      exists: jest.fn(),
      read: jest.fn(),
      write: jest.fn(),
      mkdir: jest.fn(),
      trashSystem: jest.fn(),
    },
  },
  metadataCache: {
    getFileCache: jest.fn(),
    getCache: jest.fn(),
    getFirstLinkpathDest: jest.fn(),
    getBacklinksForFile: jest.fn(),
  },
  workspace: {
    getActiveFile: jest.fn(),
  },
  plugins: {
    enabledPlugins: new Set(),
    plugins: {
      dataview: {
        api: {
          page: jest.fn(),
          evaluateInline: jest.fn(),
          executeJs: jest.fn(),
          tryQueryMarkdown: jest.fn(),
          settings: {
            dataviewJsKeyword: "dataviewjs",
            inlineQueryPrefix: "=",
            inlineJsQueryPrefix: "$=",
            renderNullAs: "null",
          },
        },
      },
    },
  },
};
