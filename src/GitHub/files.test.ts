import { FilesManagement } from './files';
import { app } from '../__mocks__/obsidian';
import { Octokit } from '@octokit/core';
import { TFile, TFolder } from 'obsidian';

jest.mock('obsidian');

describe('FilesManagement', () => {
  let octokit: Octokit;
  let filesManagement: FilesManagement;

  beforeEach(() => {
    octokit = new Octokit();
    filesManagement = new FilesManagement(octokit, app);
  });

  describe('getSharedFiles', () => {
    it('should return shared files', () => {
      const sharedFiles = [
        new TFile('file1.md', 'file1.md', 0, 0, 0, 0, 0, 0, 0, 0),
        new TFile('file2.md', 'file2.md', 0, 0, 0, 0, 0, 0, 0, 0),
      ];

      app.vault.getMarkdownFiles.mockReturnValue(sharedFiles);
      app.metadataCache.getCache.mockReturnValue({ frontmatter: { share: true } });

      const result = filesManagement.getSharedFiles(null);

      expect(result).toEqual(sharedFiles);
    });
  });

  describe('getAllFileWithPath', () => {
    it('should return all files with their paths', () => {
      const files = [
        new TFile('file1.md', 'file1.md', 0, 0, 0, 0, 0, 0, 0, 0),
        new TFile('file2.md', 'file2.md', 0, 0, 0, 0, 0, 0, 0, 0, 0),
      ];

      app.vault.getFiles.mockReturnValue(files);
      app.metadataCache.getCache.mockReturnValue({ frontmatter: { share: true } });

      const result = filesManagement.getAllFileWithPath(null, {});

      expect(result).toEqual([
        { converted: 'file1.md', real: files[0], otherPaths: undefined },
        { converted: 'file2.md', real: files[1], otherPaths: undefined },
      ]);
    });
  });

  describe('getLinkedByEmbedding', () => {
    it('should return linked files by embedding', () => {
      const file = new TFile('file1.md', 'file1.md', 0, 0, 0, 0, 0, 0, 0, 0);
      const linkedFile = new TFile('file2.md', 'file2.md', 0, 0, 0, 0, 0, 0, 0, 0);

      app.metadataCache.getFileCache.mockReturnValue({
        embeds: [{ link: 'file2.md', displayText: 'file2', position: { start: { offset: 0 }, end: { offset: 0 } } }],
      });
      app.metadataCache.getFirstLinkpathDest.mockReturnValue(linkedFile);

      const result = filesManagement.getLinkedByEmbedding(file);

      expect(result).toEqual([
        {
          linked: linkedFile,
          linkFrom: 'file2.md',
          altText: 'file2',
          type: 'embed',
          position: { start: 0, end: 0 },
        },
      ]);
    });
  });
});
