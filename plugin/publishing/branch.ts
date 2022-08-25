import {Octokit} from "@octokit/core";
import {GitHubPublisherSettings} from "../settings/interface";
import {FilesManagement} from "./filesManagement";
import {MetadataCache, Vault} from "obsidian";
import GithubPublisherPlugin from "../main";

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
	
	async getMasterBranch() {
		const allBranch = await this.octokit.request('GET' + ' /repos/{owner}/{repo}/branches', {
			owner: this.settings.githubName,
			repo: this.settings.githubRepo,
		});
		const mainBranch = allBranch.data.find((branch: { name: string; }) => branch.name === 'main' || branch.name === 'master');
		return mainBranch.name;
	}
	
	async newBranch(branchName: string) {
		/**
		 * Create a new branch on the repo named "Vault-date"
		 * Pass if the branch already exists
		 * @param branchName
		 */
		const allBranch = await this.octokit.request('GET' + ' /repos/{owner}/{repo}/branches', {
			owner: this.settings.githubName,
			repo: this.settings.githubRepo,
		});
		const mainBranch = allBranch.data.find((branch: { name: string; }) => branch.name === 'main' || branch.name === 'master');
		const shaMainBranch = mainBranch.commit.sha;
		try {
			const branch = await this.octokit.request(
				"POST" + " /repos/{owner}/{repo}/git/refs",
				{
					owner: this.settings.githubName,
					repo: this.settings.githubRepo,
					ref: "refs/heads/" + branchName,
					sha: shaMainBranch,
				}
			);
			return branch.status === 201;
		} catch (e) {
			// catch the old branch
			const allBranch = await this.octokit.request('GET' + ' /repos/{owner}/{repo}/branches', {
				owner: this.settings.githubName,
				repo: this.settings.githubRepo,
			});
			const mainBranch = allBranch.data.find((branch: { name: string; }) => branch.name === branchName);
			return !!mainBranch;
		}
	}

	async pullRequest(branchName: string) {
		/**
		 * Create a pull request on main/master from the new branch
		 * @param branchName
		 */
		return await this.octokit.request('POST' +
			' /repos/{owner}/{repo}/pulls', {
			owner: this.settings.githubName,
			repo: this.settings.githubRepo,
			title: `PullRequest ${branchName} from Obsidian`,
			body: "",
			head: branchName,
			base: "main",
		});
	}

	async deleteBranch(branchName: string) {
		/**
		 * After the merge, delete the new branch
		 * @param branchName
		 */
		const octokit = new Octokit({
			auth: this.settings.GhToken,
		});
		try {
			const branch = await octokit.request(
				"DELETE" + " /repos/{owner}/{repo}/git/refs/heads/" + branchName,
				{
					owner: this.settings.githubName,
					repo: this.settings.githubRepo,
				}
			);
			return branch.status === 200;
		} catch (e) {
			return false;
		}
	}


	async mergePullRequest (branchName: string, silent = false, pullRequestNumber: number) {
		/**
		 * Automatically merge pull request from the plugin
		 * @param branchName
		 * @param silent No logging message
		 * @param pullRequestNumber number of the new pullrequest
		 */
		const octokit = new Octokit({
			auth: this.settings.GhToken,
		});
		const branch = await octokit.request(
			"PUT" + " /repos/{owner}/{repo}/pulls/{pull_number}/merge",
			{
				owner: this.settings.githubName,
				repo: this.settings.githubRepo,
				pull_number: pullRequestNumber,
				commit_title: `[PUBLISHER] Merge #${pullRequestNumber}`,
				merge_method: "squash",
			}
		);
		return branch.status === 200;
	}
	async updateRepository(branchName: string) {
		/**
		 * Run merging + deleting branch in once
		 * @param branchName
		 */
		const pullRequest = await this.pullRequest(branchName);
		// @ts-ignore
		await this.mergePullRequest(branchName, true, pullRequest.data.number);
		await this.deleteBranch(branchName);
		return true
	}
}
