import {Octokit} from "@octokit/core";
import {GitHubPublisherSettings, RepoFrontmatter} from "../settings/interface";
import {FilesManagement} from "./filesManagement";
import {MetadataCache, Notice, Vault} from "obsidian";
import GithubPublisherPlugin from "../main";
import {StringFunc, error} from "../i18n";
import {noticeLog} from "../src/utils";

export class GithubBranch extends FilesManagement {
	settings: GitHubPublisherSettings;
	octokit: Octokit;
	vault: Vault;
	metadataCache: MetadataCache;
	plugin: GithubPublisherPlugin;

	constructor(settings: GitHubPublisherSettings,
		octokit: Octokit,
		vault: Vault,
		metadataCache: MetadataCache,
		plugin: GithubPublisherPlugin) {
		super(vault, metadataCache, settings, octokit, plugin);
		this.settings = settings;
		this.octokit = octokit;
		this.plugin = plugin;
	}

	async newBranch(branchName: string, repoFrontmatter: RepoFrontmatter[] | RepoFrontmatter) {
		if (repoFrontmatter instanceof Array) {
			for (const repo of repoFrontmatter) {
				await this.newBranchOnRepo(branchName, repo);
			}
		}
		else {
			await this.newBranchOnRepo(branchName, repoFrontmatter);
		}
	}

	async newBranchOnRepo(branchName: string, repoFrontmatter: RepoFrontmatter) {
		/**
		 * Create a new branch on the repo named "Vault-date"
		 * Pass if the branch already exists
		 * @param branchName
		 */
		const allBranch = await this.octokit.request('GET' + ' /repos/{owner}/{repo}/branches', {
			owner: repoFrontmatter.owner,
			repo: repoFrontmatter.repo,
		});
		const mainBranch = allBranch.data.find((branch: { name: string; }) => branch.name === repoFrontmatter.branch);
		const shaMainBranch = mainBranch.commit.sha;

		try {
			const branch = await this.octokit.request(
				"POST" + " /repos/{owner}/{repo}/git/refs",
				{
					owner: repoFrontmatter.owner,
					repo: repoFrontmatter.repo,
					ref: "refs/heads/" + branchName,
					sha: shaMainBranch,
				}
			);
			noticeLog(`branch successfully created : ${branch.status} for :  ${repoFrontmatter.repo}`, this.settings);
			return branch.status === 201;
		} catch (e) {
			// catch the old branch
			noticeLog(e, this.settings);
			const allBranch = await this.octokit.request('GET' + ' /repos/{owner}/{repo}/branches', {
				owner: repoFrontmatter.owner,
				repo: repoFrontmatter.repo,
			});
			const mainBranch = allBranch.data.find((branch: { name: string; }) => branch.name === branchName);
			return !!mainBranch;
		}
	}


	async pullRequestOnRepo(branchName: string, repoFrontmatter: RepoFrontmatter) {
		/**
		 * Create a pull request on main/master from the new branch
		 * @param branchName
		 */
		try {
			const PR = await this.octokit.request('POST' +
				' /repos/{owner}/{repo}/pulls', {
				owner: repoFrontmatter.owner,
				repo: repoFrontmatter.repo,
				title: `PullRequest ${branchName} from Obsidian`,
				body: "",
				head: branchName,
				base: repoFrontmatter.branch,
			});
			return PR.data.number;
		} catch (e) {
			noticeLog(e, this.settings);
			try {
				const PR = await this.octokit.request('GET' + ' /repos/{owner}/{repo}/pulls', {
					owner: repoFrontmatter.owner,
					repo: repoFrontmatter.repo,
					state: 'open',
				});
				return PR.data[0].number;
			} catch (e) {
				noticeLog(`${e} : ERROR with ${repoFrontmatter}`, this.settings);
				return false
			}
		}
	}


	async deleteBranchOnRepo(branchName: string, repoFrontmatter: RepoFrontmatter) {
		/**
		 * After the merge, delete the new branch
		 * @param branchName
		 */

		try {
			const branch = await this.octokit.request(
				"DELETE" + " /repos/{owner}/{repo}/git/refs/heads/" + branchName,
				{
					owner: repoFrontmatter.owner,
					repo: repoFrontmatter.repo,
				}
			);
			return branch.status === 200;
		} catch (e) {
			return false;
		}
	}

	async mergePullRequestOnRepo(branchName: string, silent = false, pullRequestNumber: number, repoFrontmatter: RepoFrontmatter) {
		/**
		 * Automatically merge pull request from the plugin
		 * @param branchName
		 * @param silent No logging message
		 * @param pullRequestNumber number of the new pullrequest
		 */

		try {
			const branch = await this.octokit.request(
				"PUT" + " /repos/{owner}/{repo}/pulls/{pull_number}/merge",
				{
					owner: repoFrontmatter.owner,
					repo: repoFrontmatter.repo,
					pull_number: pullRequestNumber,
					commit_title: `[PUBLISHER] Merge #${pullRequestNumber}`,
					merge_method: "squash",
				}
			);
			return branch.status === 200;

		} catch (e) {
			noticeLog(e, this.settings);
			new Notice(error('mergeconflic') as string);
			return false;
		}
	}

	async updateRepository(branchName: string, repoFrontmatter: RepoFrontmatter|RepoFrontmatter[]) {
		if (repoFrontmatter instanceof Array) {
			const success: boolean[]=[];
			for (const repo of repoFrontmatter) {
				success.push(await this.updateRepositoryOnOne(branchName, repo));
			}

			return !success.every((value) => value === false);
		}
		else {
			return await this.updateRepositoryOnOne(branchName, repoFrontmatter);
		}
	}

	async updateRepositoryOnOne(branchName: string, repoFrontmatter: RepoFrontmatter) {
		/**
		 * Run merging + deleting branch in once
		 * @param branchName
		 */
		try {
			const pullRequest = await this.pullRequestOnRepo(branchName, repoFrontmatter);
			if (this.settings.automaticallyMergePR) {
				const PRSuccess = await this.mergePullRequestOnRepo(branchName, true, pullRequest, repoFrontmatter);
				if (PRSuccess) {
					await this.deleteBranchOnRepo(branchName, repoFrontmatter);
					return true
				}
				return false
			}
			return true
		}
		catch (e) {
			noticeLog(e, this.settings);
			new Notice((error("errorConfig") as StringFunc)(`${repoFrontmatter.owner}/${repoFrontmatter.repo}`));
			return false
		}
	}
}
