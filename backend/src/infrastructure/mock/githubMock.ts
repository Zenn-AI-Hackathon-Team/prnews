import type { PullRequest } from "../../domain/pullRequest.js";
import type { GithubPort } from "../../ports/githubPort.js";

export const githubMock = (): GithubPort => ({
	async fetchPullRequest(
		owner: string,
		repo: string,
		number: number,
	): Promise<PullRequest> {
		return {
			id: "mock-pr-id",
			prNumber: number,
			repository: `${owner}/${repo}`,
			title: "モックPRタイトル",
			diff: "mock diff",
			authorLogin: "mockuser",
			createdAt: new Date().toISOString(),
		};
	},
});
