import { deleteFromGithub, filterGithubFile } from './delete';
import { app } from '../__mocks__/obsidian';
import { Octokit } from '@octokit/core';
import { FilesManagement } from './files';

jest.mock('obsidian');

describe('deleteFromGithub', () => {
  let octokit: Octokit;
  let filesManagement: FilesManagement;

  beforeEach(() => {
    octokit = new Octokit();
    filesManagement = new FilesManagement(octokit, app);
  });

  describe('deleteFromGithub', () => {
    it('should delete files from GitHub for each repository', async () => {
      const repoProperties = {
        frontmatter: [
          { owner: 'owner1', repo: 'repo1', branch: 'main' },
          { owner: 'owner2', repo: 'repo2', branch: 'main' },
        ],
        repository: null,
      };

      const deleteFromGithubOneRepoSpy = jest.spyOn(filesManagement, 'deleteFromGithubOneRepo').mockResolvedValue({
        success: true,
        deleted: ['file1', 'file2'],
        undeleted: [],
      });

      const result = await deleteFromGithub(false, 'branchName', filesManagement, repoProperties);

      expect(deleteFromGithubOneRepoSpy).toHaveBeenCalledTimes(2);
      expect(deleteFromGithubOneRepoSpy).toHaveBeenCalledWith(false, 'branchName', filesManagement, {
        frontmatter: repoProperties.frontmatter[0],
        repository: repoProperties.repository,
        convert: undefined,
      });
      expect(deleteFromGithubOneRepoSpy).toHaveBeenCalledWith(false, 'branchName', filesManagement, {
        frontmatter: repoProperties.frontmatter[1],
        repository: repoProperties.repository,
        convert: undefined,
      });
      expect(result).toEqual({
        success: true,
        deleted: ['file1', 'file2'],
        undeleted: [],
      });
    });
  });

  describe('filterGithubFile', () => {
    it('should filter GitHub files based on settings and properties', async () => {
      const fileInRepo = [
        { file: 'file1.md', sha: 'sha1' },
        { file: 'file2.md', sha: 'sha2' },
        { file: 'file3.png', sha: 'sha3' },
      ];

      const settings = {
        upload: {
          behavior: 'default',
          rootFolder: 'root',
          defaultName: 'default',
          attachment: {
            folder: 'attachments',
          },
          autoclean: {
            includeAttachments: true,
            excluded: [],
          },
        },
        embed: {
          unHandledObsidianExt: [],
        },
      };

      const prop = {
        path: {
          type: 'default',
          rootFolder: 'root',
          defaultName: 'default',
          attachment: {
            folder: 'attachments',
          },
        },
      };

      const result = await filterGithubFile(fileInRepo, settings, prop);

      expect(result).toEqual([
        { file: 'file1.md', sha: 'sha1' },
        { file: 'file2.md', sha: 'sha2' },
        { file: 'file3.png', sha: 'sha3' },
      ]);
    });
  });
});
