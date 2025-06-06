import { Octokit } from "@octokit/rest";
import { ErrorCode } from "@prnews/common";
import type { PullRequest } from "../../domain/pullRequest";
import type { RepositoryInfo } from "../../domain/repository";
import type { GithubPort } from "../../ports/githubPort";

const getOctokit = (accessToken: string) => new Octokit({ auth: accessToken });

export const githubClient = (): GithubPort => ({
	async fetchPullRequest(accessToken, owner, repo, number) {
		const octokit = getOctokit(accessToken);
		const { data: prData } = await octokit.pulls.get({
			owner,
			repo,
			pull_number: number,
		});
		const pr: PullRequest = {
			id: String(prData.id),
			prNumber: prData.number,
			repository: prData.base.repo.full_name,
			title: prData.title,
			diff: "", // 必要に応じて取得
			authorLogin: prData.user?.login || "",
			createdAt: prData.created_at,
		};
		return pr;
	},
	async getRepositoryByOwnerAndRepo(accessToken, owner, repo) {
		const octokit = getOctokit(accessToken);
		try {
			const { data } = await octokit.repos.get({ owner, repo });
			return {
				githubRepoId: data.id,
				repositoryFullName: data.full_name,
				owner: data.owner.login,
				repo: data.name,
			};
		} catch (error: unknown) {
			console.error(`Failed to fetch repository ${owner}/${repo}`, error);
			if (
				typeof error === "object" &&
				error !== null &&
				"status" in error &&
				typeof (error as { status?: unknown }).status === "number" &&
				(error as { status: number }).status === 404
			) {
				throw new Error(ErrorCode.GITHUB_REPO_NOT_FOUND);
			}
			throw new Error(ErrorCode.INTERNAL_SERVER_ERROR);
		}
	},
});
