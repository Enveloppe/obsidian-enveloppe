import type { Properties } from "@interfaces/main";
import type { Octokit } from "@octokit/core";
import i18next from "i18next";
import { Notice } from "obsidian";
import { FilesManagement } from "src/GitHub/files";
import type Enveloppe from "src/main";
import type { Logs } from "../utils/logs";

export class GithubBranch extends FilesManagement {
	console: Logs;
	constructor(octokit: Octokit, plugin: Enveloppe) {
		super(octokit, plugin);
		this.console = plugin.console;
	}

	/**
	 * Check if Properties is an array or not and run the newBranchOnRepo function on each repo
	 * @param {Properties[] | Properties} prop The repo to use
	 */

	async newBranch(prop: Properties[] | Properties) {
		prop = Array.isArray(prop) ? prop : [prop];
		for (const repo of prop) {
			await this.newBranchOnRepo(repo);
		}
	}

	/**
	 * Create a new branch on the repo named "Vault-date"
	 * Pass if the branch already exists
	 * Run in a loop in the newBranch function if Properties[] is passed
	 * @param {Properties} prop The repo to use
	 * @return {Promise<boolean>} True if the branch is created
	 */

	async newBranchOnRepo(prop: Properties): Promise<boolean> {
		const allBranch = await this.octokit.request("GET /repos/{owner}/{repo}/branches", {
			owner: prop.owner,
			repo: prop.repo,
		});
		const mainBranch = allBranch.data.find(
			(branch: { name: string }) => branch.name === prop.branch
		);
		if (!mainBranch) return false;
		try {
			const shaMainBranch = mainBranch!.commit.sha;
			const branch = await this.octokit.request("POST /repos/{owner}/{repo}/git/refs", {
				owner: prop.owner,
				repo: prop.repo,
				ref: `refs/heads/${this.branchName}`,
				sha: shaMainBranch,
			});
			this.console.notif(
				{},
				i18next.t("publish.branch.success", { branchStatus: branch.status, repo: prop })
			);
			return branch.status === 201;
		} catch (_e) {
			// catch the old branch
			try {
				const allBranch = await this.octokit.request(
					"GET /repos/{owner}/{repo}/branches",
					{
						owner: prop.owner,
						repo: prop.repo,
					}
				);
				const mainBranch = allBranch.data.find(
					(branch: { name: string }) => branch.name === this.branchName
				);
				this.console.notif(
					{},
					i18next.t("publish.branch.alreadyExists", {
						branchName: this.branchName,
						repo: prop,
					})
				);
				return !!mainBranch;
			} catch (e) {
				this.console.notif({ e: true }, e);
				return false;
			}
		}
	}

	/**
	 * Create a pull request on prop.branch with the branchName
	 * Run in a loop in the pullRequest function if Properties[] is passed
	 * @param {Properties} prop The repo to use
	 * @return {Promise<number>} False in case of error, the pull request number otherwise
	 */

	async pullRequestOnRepo(prop: Properties): Promise<number> {
		try {
			const pr = await this.octokit.request("POST /repos/{owner}/{repo}/pulls", {
				owner: prop.owner,
				repo: prop.repo,
				title: i18next.t("publish.branch.prMessage", { branchName: this.branchName }),
				body: "",
				head: this.branchName,
				base: prop.branch,
			});
			return pr.data.number;
		} catch (e) {
			this.console.logs({ e: true }, e);
			//trying to get the last open PR number
			try {
				const pr = await this.octokit.request("GET /repos/{owner}/{repo}/pulls", {
					owner: prop.owner,
					repo: prop.repo,
					state: "open",
				});
				return pr.data[0]?.number || 0;
			} catch (e) {
				// there is no open PR and impossible to create a new one
				this.console.notif(
					{ e: true },
					i18next.t("publish.branch.error", { error: e, repo: prop })
				);
				return 0;
			}
		}
	}

	/**
	 * After the merge, delete the new branch on the repo
	 * Run in a loop in the updateRepository function if Properties[] is passed
	 * @param {Properties} prop The repo to use
	 * @return {Promise<boolean>} true if the branch is deleted
	 */

	async deleteBranchOnRepo(prop: Properties): Promise<boolean> {
		try {
			const branch = await this.octokit.request(
				`DELETE /repos/{owner}/{repo}/git/refs/heads/${this.branchName}`,
				{
					owner: prop.owner,
					repo: prop.repo,
				}
			);
			return branch.status === 200;
		} catch (e) {
			this.console.logs({ e: true }, e);
			return false;
		}
	}

	/**
	 * Automatically merge pull request from the plugin (only if the settings allow it)
	 * Run in a loop in the updateRepository function if Properties[] is passed
	 * @param {number} pullRequestNumber  number of the new pullrequest
	 * @param {Properties} prop The repo to use
	 */

	async mergePullRequestOnRepo(pullRequestNumber: number, prop: Properties) {
		const commitMsg =
			prop.commitMsg || prop.commitMsg.trim().length > 0
				? `${prop.commitMsg} #${pullRequestNumber}`
				: `[PUBLISHER] Merge #${pullRequestNumber}`;
		try {
			const branch = await this.octokit.request(
				"PUT /repos/{owner}/{repo}/pulls/{pull_number}/merge",
				{
					owner: prop.owner,
					repo: prop.repo,
					// biome-ignore lint/style/useNamingConvention: hey, say that to github!
					pull_number: pullRequestNumber,
					// biome-ignore lint/style/useNamingConvention: hey, say that to github!
					commit_title: commitMsg,
					// biome-ignore lint/style/useNamingConvention: hey, say that to github!
					merge_method: "squash",
				}
			);
			return branch.status === 200;
		} catch (e) {
			this.console.notif({ e: true }, e);
			new Notice(i18next.t("error.mergeconflic"));
			return false;
		}
	}
	/**
	 * Update the repository with the new branch : PR, merging and deleting the branch if allowed by the global settings
	 * @param {Properties | Properties[]} prop The repo to use
	 * @returns {Promise<boolean>} True if the update is successful
	 */
	async updateRepository(
		prop: Properties | Properties[],
		dryRun = false
	): Promise<boolean> {
		if (dryRun) return true;
		prop = Array.isArray(prop) ? prop : [prop];
		const success: boolean[] = [];
		for (const repo of prop) {
			success.push(await this.updateRepositoryOnOne(repo));
		}
		return !success.every((value) => value === false);
	}

	/**
	 * Run merging + deleting branch in once, for one repo
	 * Run in a loop in the updateRepository function if Properties[] is passed
	 * @param {Properties} prop The repo to use
	 * @returns {Promise<boolean>} true if the update is successful
	 */

	async updateRepositoryOnOne(prop: Properties): Promise<boolean> {
		if (this.settings.github.dryRun.enable) return true;
		try {
			const pullRequest = await this.pullRequestOnRepo(prop);
			if (prop.automaticallyMergePR && pullRequest !== 0) {
				const prSuccess = await this.mergePullRequestOnRepo(pullRequest, prop);
				if (prSuccess) {
					await this.deleteBranchOnRepo(prop);
					return true;
				}
				return false;
			}
			return true;
		} catch (e) {
			this.console.logs({ e: true }, e);
			new Notice(i18next.t("error.errorConfig", { repo: prop }));
			return false;
		}
	}

	/**
	 * Use octokit to check if:
	 * - the repo exists
	 * - the main branch exists
	 * Send a notice if the repo doesn't exist or if the main branch doesn't exist
	 * Note: If one of the repo defined in the list doesn't exist, the rest of the list will not be checked because the octokit request throws an error
	 * @param {Properties | Properties[]} prop
	 * @param silent Send a notice if the repo is valid
	 * @return {Promise<void>}
	 */
	async checkRepository(prop: Properties | Properties[], silent = true): Promise<void> {
		prop = Array.isArray(prop) ? prop : [prop];
		for (const repo of prop) {
			try {
				const repoExist = await this.octokit
					.request("GET /repos/{owner}/{repo}", {
						owner: repo.owner,
						repo: repo.repo,
					})
					.catch((e) => {
						//check the error code
						if (e.status === 404) {
							new Notice(i18next.t("commands.checkValidity.inRepo.error404", { repo }));
						} else if (e.status === 403) {
							new Notice(i18next.t("commands.checkValidity.inRepo.error403", { repo }));
						} else if (e.status === 301) {
							new Notice(i18next.t("commands.checkValidity.inRepo.error301", { repo }));
						}
					});
				//@ts-ignore
				if (repoExist.status === 200) {
					this.console.notif(
						{},
						i18next.t("commands.checkValidity.repoExistsTestBranch", { repo })
					);

					const branchExist = await this.octokit
						.request("GET /repos/{owner}/{repo}/branches/{branch}", {
							owner: repo.owner,
							repo: repo.repo,
							branch: repo.branch,
						})
						.catch((e) => {
							//check the error code
							if (e.status === 404) {
								new Notice(
									i18next.t("commands.checkValidity.inBranch.error404", { repo })
								);
							} else if (e.status === 403) {
								new Notice(
									i18next.t("commands.checkValidity.inBranch.error403", { repo })
								);
							}
						});
					//@ts-ignore
					if (branchExist.status === 200 && !silent) {
						new Notice(i18next.t("commands.checkValidity.success", { repo }));
					}
				}
			} catch (e) {
				this.console.logs({ e: true }, e);
				new Notice(i18next.t("commands.checkValidity.error", { repo }));
				break;
			}
		}
	}
}
