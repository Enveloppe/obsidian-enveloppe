import { GithubBranch } from './branch';
import { app } from '../__mocks__/obsidian';
import { Octokit } from '@octokit/core';

jest.mock('obsidian');

describe('GithubBranch', () => {
  let octokit: Octokit;
  let githubBranch: GithubBranch;

  beforeEach(() => {
    octokit = new Octokit();
    githubBranch = new GithubBranch(octokit, app);
  });

  describe('newBranch', () => {
    it('should create a new branch for each repository', async () => {
      const prop = [
        { owner: 'owner1', repo: 'repo1', branch: 'main' },
        { owner: 'owner2', repo: 'repo2', branch: 'main' },
      ];

      const newBranchOnRepoSpy = jest.spyOn(githubBranch, 'newBranchOnRepo').mockResolvedValue(true);

      await githubBranch.newBranch(prop);

      expect(newBranchOnRepoSpy).toHaveBeenCalledTimes(2);
      expect(newBranchOnRepoSpy).toHaveBeenCalledWith(prop[0]);
      expect(newBranchOnRepoSpy).toHaveBeenCalledWith(prop[1]);
    });
  });

  describe('pullRequestOnRepo', () => {
    it('should create a pull request for the repository', async () => {
      const prop = { owner: 'owner', repo: 'repo', branch: 'main' };

      const requestSpy = jest.spyOn(octokit, 'request').mockResolvedValue({
        data: { number: 1 },
      } as any);

      const prNumber = await githubBranch.pullRequestOnRepo(prop);

      expect(requestSpy).toHaveBeenCalledWith('POST /repos/{owner}/{repo}/pulls', {
        owner: 'owner',
        repo: 'repo',
        title: 'PUBLISHER: Merge branch',
        body: '',
        head: 'branch',
        base: 'main',
      });
      expect(prNumber).toBe(1);
    });
  });

  describe('deleteBranchOnRepo', () => {
    it('should delete the branch for the repository', async () => {
      const prop = { owner: 'owner', repo: 'repo', branch: 'main' };

      const requestSpy = jest.spyOn(octokit, 'request').mockResolvedValue({
        status: 200,
      } as any);

      const result = await githubBranch.deleteBranchOnRepo(prop);

      expect(requestSpy).toHaveBeenCalledWith('DELETE /repos/{owner}/{repo}/git/refs/heads/branch', {
        owner: 'owner',
        repo: 'repo',
      });
      expect(result).toBe(true);
    });
  });
});
