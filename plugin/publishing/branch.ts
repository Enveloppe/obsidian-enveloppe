import { Octokit } from "@octokit/core";
import {
	GitHubPublisherSettings,
	RepoFrontmatter,
} from "../settings/interface";
import { FilesManagement } from "./filesManagement";
import { MetadataCache, Notice, Vault } from "obsidian";
import GithubPublisherPlugin from "../main";
import { StringFunc, error } from "../i18n";
import { noticeLog } from "../src/utils";

/**
 * Class to manage the branch
 * @extends FilesManagement
 * @param {GithubPublisherPlugin} plugin - The plugin
 * @param {Octokit} octokit - The octokit instance
 * @param {Vault} vault - The vault
 * @param {MetadataCache} metadataCache - The metadataCache
 * @param {GitHubPublisherSettings} settings - The settings
 **/

export class GithubBranch extends FilesManagement {
	settings: GitHubPublisherSettings;
	octokit: Octokit;
	vault: Vault;
	metadataCache: MetadataCache;
	plugin: GithubPublisherPlugin;

	/**
	 * Manage the branch
	 * @param {GitHubPublisherSettings} settings The name of the branch to create
	 * @param {Octokit} octokit The octokit instance
	 * @param {Vault} vault The vault
	 * @param {MetadataCache} metadataCache The metadataCache
	 * @param {GithubPublisherPlugin} plugin The plugin
	 *
	 **/

	constructor(
		settings: GitHubPublisherSettings,
		octokit: Octokit,
		vault: Vault,
		metadataCache: MetadataCache,
		plugin: GithubPublisherPlugin
	) {
		super(vault, metadataCache, settings, octokit, plugin);
		this.settings = settings;
		this.octokit = octokit;
		this.plugin = plugin;
	}

	/**
	 * Check if RepoFrontmatter is an array or not and run the newBranchOnRepo function on each repo
	 * @param {string} branchName The name of the branch to create
	 * @param {RepoFrontmatter[] | RepoFrontmatter} repoFrontmatter The repo to use
	 */

	async newBranch(
		branchName: string,
		repoFrontmatter: RepoFrontmatter[] | RepoFrontmatter
	) {
		repoFrontmatter = Array.isArray(repoFrontmatter)
			? repoFrontmatter
			: [repoFrontmatter];
		for (const repo of repoFrontmatter) {
			await this.newBranchOnRepo(branchName, repo);
		}
	}

	/**
	 * Create a new branch on the repo named "Vault-date"
	 * Pass if the branch already exists
	 * Run in a loop in the newBranch function if RepoFrontmatter[] is passed
	 * @param {string} branchName The name of the branch to create
	 * @param {RepoFrontmatter} repoFrontmatter The repo to use
	 * @return {Promise<boolean>} True if the branch is created
	 */

	async newBranchOnRepo(
		branchName: string,
		repoFrontmatter: RepoFrontmatter
	): Promise<boolean> {
		const allBranch = await this.octokit.request(
			"GET" + " /repos/{owner}/{repo}/branches",
			{
				owner: repoFrontmatter.owner,
				repo: repoFrontmatter.repo,
			}
		);
		const mainBranch = allBranch.data.find(
			(branch: { name: string }) => branch.name === repoFrontmatter.branch
		);
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
			noticeLog(
				`branch successfully created : ${branch.status} for :  ${repoFrontmatter.repo}`,
				this.settings
			);
			return branch.status === 201;
		} catch (e) {
			// catch the old branch
			noticeLog(e, this.settings);
			const allBranch = await this.octokit.request(
				"GET" + " /repos/{owner}/{repo}/branches",
				{
					owner: repoFrontmatter.owner,
					repo: repoFrontmatter.repo,
				}
			);
			const mainBranch = allBranch.data.find(
				(branch: { name: string }) => branch.name === branchName
			);
			return !!mainBranch;
		}
	}

	/**
	 * Create a pull request on repoFrontmatter.branch with the branchName
	 * Run in a loop in the pullRequest function if RepoFrontmatter[] is passed
	 * @param {string} branchName The name of the branch to create
	 * @param {RepoFrontmatter} repoFrontmatter The repo to use
	 * @return {Promise<number>} False in case of error, the pull request number otherwise
	 */

	async pullRequestOnRepo(
		branchName: string,
		repoFrontmatter: RepoFrontmatter
	): Promise<number> {
		try {
			const PR = await this.octokit.request(
				"POST" + " /repos/{owner}/{repo}/pulls",
				{
					owner: repoFrontmatter.owner,
					repo: repoFrontmatter.repo,
					title: `PullRequest ${branchName} from Obsidian`,
					body: "",
					head: branchName,
					base: repoFrontmatter.branch,
				}
			);
			return PR.data.number;
		} catch (e) {
			noticeLog(e, this.settings);
			try {
				const PR = await this.octokit.request(
					"GET" + " /repos/{owner}/{repo}/pulls",
					{
						owner: repoFrontmatter.owner,
						repo: repoFrontmatter.repo,
						state: "open",
					}
				);
				return PR.data[0].number;
			} catch (e) {
				noticeLog(
					`${e} : ERROR with ${repoFrontmatter}`,
					this.settings
				);
				return 0;
			}
		}
	}

	/**
	 * After the merge, delete the new branch on the repo
	 * Run in a loop in the updateRepository function if RepoFrontmatter[] is passed
	 * @param {settings} branchName The name of the branch to create
	 * @param {RepoFrontmatter} repoFrontmatter The repo to use
	 * @return {Promise<boolean>} true if the branch is deleted
	 */

	async deleteBranchOnRepo(
		branchName: string,
		repoFrontmatter: RepoFrontmatter
	): Promise<boolean> {
		try {
			const branch = await this.octokit.request(
				"DELETE" +
					" /repos/{owner}/{repo}/git/refs/heads/" +
					branchName,
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

	/**
	 * Automatically merge pull request from the plugin (only if the settings allow it)
	 * Run in a loop in the updateRepository function if RepoFrontmatter[] is passed
	 * @param {string} branchName The name of the branch to create
	 * @param {boolean} silent No logging message
	 * @param {number} pullRequestNumber  number of the new pullrequest
	 * @param {RepoFrontmatter} repoFrontmatter The repo to use
	 */

	async mergePullRequestOnRepo(
		branchName: string,
		silent = false,
		pullRequestNumber: number,
		repoFrontmatter: RepoFrontmatter
	) {
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
			new Notice(error("mergeconflic") as string);
			return false;
		}
	}
	/**
	 * Update the repository with the new branch : PR, merging and deleting the branch if allowed by the global settings
	 * @param {string} branchName The name of the branch to merge
	 * @param {RepoFrontmatter | RepoFrontmatter[]} repoFrontmatter The repo to use
	 * @returns {Promise<boolean>} True if the update is successful
	 */
	async updateRepository(
		branchName: string,
		repoFrontmatter: RepoFrontmatter | RepoFrontmatter[]
	): Promise<boolean> {
		repoFrontmatter = Array.isArray(repoFrontmatter)
			? repoFrontmatter
			: [repoFrontmatter];
		const success: boolean[] = [];
		for (const repo of repoFrontmatter) {
			success.push(await this.updateRepositoryOnOne(branchName, repo));
		}
		return !success.every((value) => value === false);
	}

	/**
	 * Run merging + deleting branch in once, for one repo
	 * Run in a loop in the updateRepository function if RepoFrontmatter[] is passed
	 * @param {string}  branchName The name of the branch to merge
	 * @param {RepoFrontmatter} repoFrontmatter The repo to use
	 * @returns {Promise<boolean>} true if the update is successful
	 */

	async updateRepositoryOnOne(
		branchName: string,
		repoFrontmatter: RepoFrontmatter
	): Promise<boolean> {
		try {
			const pullRequest = await this.pullRequestOnRepo(
				branchName,
				repoFrontmatter
			);
			if (this.settings.automaticallyMergePR && pullRequest !== 0) {
				const PRSuccess = await this.mergePullRequestOnRepo(
					branchName,
					true,
					pullRequest,
					repoFrontmatter
				);
				if (PRSuccess) {
					await this.deleteBranchOnRepo(branchName, repoFrontmatter);
					return true;
				}
				return false;
			}
			return true;
		} catch (e) {
			noticeLog(e, this.settings);
			new Notice(
				(error("errorConfig") as StringFunc)(
					`${repoFrontmatter.owner}/${repoFrontmatter.repo}`
				)
			);
			return false;
		}
	}
}
