import Publisher from './upload';
import { app } from '../__mocks__/obsidian';
import { Octokit } from '@octokit/core';
import { TFile } from 'obsidian';

jest.mock('obsidian');

describe('Publisher', () => {
  let octokit: Octokit;
  let publisher: Publisher;

  beforeEach(() => {
    octokit = new Octokit();
    publisher = new Publisher(octokit, app);
  });

  describe('publish', () => {
    it('should publish a file to GitHub', async () => {
      const file = new TFile('file1.md', 'file1.md', 0, 0, 0, 0, 0, 0, 0, 0);
      const repoProperties = {
        frontmatter: { owner: 'owner', repo: 'repo', branch: 'main' },
        repository: null,
      };

      const uploadTextSpy = jest.spyOn(publisher, 'uploadText').mockResolvedValue({
        isUpdated: true,
        file: 'file1.md',
      });

      const result = await publisher.publish(file, false, repoProperties, [], true, null);

      expect(uploadTextSpy).toHaveBeenCalledWith(expect.any(String), 'file1.md', 'file1.md', repoProperties.frontmatter);
      expect(result).toEqual({
        deleted: [],
        uploaded: [{ isUpdated: true, file: 'file1.md' }],
        error: [],
      });
    });
  });

  describe('uploadOnMultipleRepo', () => {
    it('should upload a file to multiple repositories', async () => {
      const file = new TFile('file1.md', 'file1.md', 0, 0, 0, 0, 0, 0, 0, 0);
      const text = 'file content';
      const path = 'file1.md';
      const embedFiles = [];
      const fileHistory = [];
      const deepScan = true;
      const shareFiles = { getSharedEmbed: jest.fn(), getMetadataLinks: jest.fn(), getLinkedByEmbedding: jest.fn() };
      const autoclean = false;
      const properties = {
        frontmatter: { owner: 'owner', repo: 'repo', branch: 'main' },
        repository: null,
      };

      const uploadTextSpy = jest.spyOn(publisher, 'uploadText').mockResolvedValue({
        isUpdated: true,
        file: 'file1.md',
      });

      const result = await publisher.uploadOnMultipleRepo(file, text, path, embedFiles, fileHistory, deepScan, shareFiles, autoclean, properties);

      expect(uploadTextSpy).toHaveBeenCalledWith(text, path, 'file1.md', properties.frontmatter);
      expect(result).toEqual({
        deleted: [],
        uploaded: [{ isUpdated: true, file: 'file1.md' }],
        error: [],
      });
    });
  });

  describe('uploadImage', () => {
    it('should upload an image to GitHub', async () => {
      const imageFile = new TFile('image.png', 'image.png', 0, 0, 0, 0, 0, 0, 0, 0);
      const properties = {
        frontmatter: { owner: 'owner', repo: 'repo', branch: 'main' },
        repository: null,
      };

      const uploadSpy = jest.spyOn(publisher, 'upload').mockResolvedValue({
        isUpdated: true,
        file: 'image.png',
      });

      const result = await publisher.uploadImage(imageFile, properties);

      expect(uploadSpy).toHaveBeenCalledWith(expect.any(String), 'image.png', '', properties.frontmatter);
      expect(result).toEqual({
        isUpdated: true,
        file: 'image.png',
      });
    });
  });
});
