import { Octokit } from "@octokit/core";
import {
	GitHubPublisherSettings,
	RepoFrontmatter,
} from "../settings/interface";
import { FilesManagement } from "./files";
import { MetadataCache, Notice, Vault } from "obsidian";
import GithubPublisherPlugin from "../main";
import { noticeLog } from "../src/utils";
import i18next from "i18next";

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
		try {
			const shaMainBranch = mainBranch.commit.sha;
			const branch = await this.octokit.request(
				"POST" + " /repos/{owner}/{repo}/git/refs",
				{
					owner: repoFrontmatter.owner,
					repo: repoFrontmatter.repo,
					ref: "refs/heads/" + branchName,
					sha: shaMainBranch,
				}
			);
			noticeLog(i18next.t("publish.branch.success", {branchStatus: branch.status, repo: repoFrontmatter}),
				this.settings
			);
			return branch.status === 201;
		} catch (e) {
			// catch the old branch
			try {
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
				noticeLog(i18next.t("publish.branch.alreadyExists", {branchName: mainBranch.name, repo: repoFrontmatter}), this.settings);
				return !!mainBranch;
			} catch (e) {
				noticeLog(e, this.settings);
				return false;
			}
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
					title: i18next.t("publish.branch.prMessage", {branchName: branchName}),
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
					i18next.t("publish.branch.error", {error: e, repo: repoFrontmatter}),
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
	 * @param {number} pullRequestNumber  number of the new pullrequest
	 * @param {RepoFrontmatter} repoFrontmatter The repo to use
	 */

	async mergePullRequestOnRepo(
		branchName: string,
		pullRequestNumber: number,
		repoFrontmatter: RepoFrontmatter
	) {
		const commitMsg = this.plugin.settings.github.worflow.customCommitMsg.trim().length > 0 ? `${this.plugin.settings.github.worflow.customCommitMsg} #${pullRequestNumber}` : `[PUBLISHER] Merge #${pullRequestNumber}`;
		try {
			const branch = await this.octokit.request(
				"PUT" + " /repos/{owner}/{repo}/pulls/{pull_number}/merge",
				{
					owner: repoFrontmatter.owner,
					repo: repoFrontmatter.repo,
					pull_number: pullRequestNumber,
					commit_title: commitMsg,
					merge_method: "squash",
				}
			);
			return branch.status === 200;
		} catch (e) {
			noticeLog(e, this.settings);
			new Notice(i18next.t("error.mergeconflic"));
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
			if (this.plugin.settings.github.automaticallyMergePR && pullRequest !== 0) {
				const PRSuccess = await this.mergePullRequestOnRepo(
					branchName,
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
			new Notice(i18next.t("error.errorConfig", {repo: repoFrontmatter})
			);
			return false;
		}
	}

	/**
	 * Use octokit to check if:
	 * - the repo exists
	 * - the main branch exists
	 * Send a notice if the repo doesn't exist or if the main branch doesn't exist
	 * Note: If one of the repo defined in the list doesn't exist, the rest of the list will not be checked because the octokit request throws an error
	 * @param {RepoFrontmatter | RepoFrontmatter[]} repoFrontmatter
	 * @param silent Send a notice if the repo is valid
	 * @return {Promise<void>}
	 */
	async checkRepository(
		repoFrontmatter: RepoFrontmatter | RepoFrontmatter[],
		silent= true): Promise<void>
	{
		repoFrontmatter = Array.isArray(repoFrontmatter)
			? repoFrontmatter
			: [repoFrontmatter];
		for (const repo of repoFrontmatter) {
			try {
				const repoExist = await this.octokit.request("GET /repos/{owner}/{repo}", {
					owner: repo.owner,
					repo: repo.repo,
				}).catch((e) => {
					//check the error code
					if (e.status === 404) {
						new Notice(
							(i18next.t("commands.checkValidity.inRepo.error404", {repo: repo}))
						);
					} else if (e.status === 403) {
						new Notice(
							(i18next.t("commands.checkValidity.inRepo.error403", {repo: repo}))
						);
					} else if (e.status === 301) {
						new Notice(
							(i18next.t("commands.checkValidity.inRepo.error301", {repo:repo}))
						);
					}
				});
				//@ts-ignore
				if (repoExist.status === 200) {
					noticeLog(i18next.t("commands.checkValidity.repoExistsTestBranch", {repo: repo}), this.settings);

					const branchExist = await this.octokit.request("GET /repos/{owner}/{repo}/branches/{branch}", {
						owner: repo.owner,
						repo: repo.repo,
						branch: repo.branch,
					}).catch((e) => {
						//check the error code
						if (e.status === 404) {
							new Notice(
								(i18next.t("commands.checkValidity.inBranch.error404", { repo: repo}))
							);
						} else if (e.status === 403) {
							new Notice(
								(i18next.t("commands.checkValidity.inBranch.error403", {repo: repo}))
							);
						}
					});
					//@ts-ignore
					if (branchExist.status === 200 && !silent) {
						new Notice(
							(i18next.t("commands.checkValidity.success", {repo: repo}))
						);
					}
				}
			} catch (e) {
				break;
			}
		}
	}
}
