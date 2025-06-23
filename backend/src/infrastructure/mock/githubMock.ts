import type { PullRequest } from "../../domain/pullRequest.js";
import type { GithubPort } from "../../ports/githubPort.js";

export const githubMock = (): GithubPort =>
	({
		async fetchPullRequest(
			accessToken: string,
			owner: string,
			repo: string,
			number: number,
		): Promise<PullRequest> {
			return {
				id: "mock-pr-id",
				prNumber: number,
				repository: `${owner}/${repo}`,
				title: "モックPRタイトル",
				body: null,
				diff: "mock diff",
				authorLogin: "mockuser",
				createdAt: new Date().toISOString(),
				comments: [],
				owner,
				repo,
			};
		},
		async getRepositoryByOwnerAndRepo(
			accessToken: string,
			owner: string,
			repo: string,
		) {
			return {
				githubRepoId: 123456,
				owner,
				repo,
				// 必要に応じて追加フィールド
			};
		},
	}) as unknown as GithubPort;

// Provide full GithubPort shape via type assertion, but we can also add dummy methods to avoid runtime errors if used.
