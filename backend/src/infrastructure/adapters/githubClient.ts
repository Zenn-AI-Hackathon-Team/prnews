import { Octokit } from "@octokit/rest";
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
		const { data } = await octokit.repos.get({ owner, repo });
		return {
			githubRepoId: data.id,
			repositoryFullName: data.full_name,
			owner: data.owner.login,
			repo: data.name,
		};
	},
});
