import type { PullRequest } from "../domain/pullRequest.js";
import type { RepositoryInfo } from "../domain/repository.js";

// PullRequestの簡易情報
export type GithubPullRequestSummary = {
	number: number;
	title: string;
	html_url: string;
	state: string;
	created_at: string;
	user: {
		login: string;
	} | null;
};

export interface GithubPort {
	fetchPullRequest(
		accessToken: string,
		owner: string,
		repo: string,
		number: number,
	): Promise<PullRequest | null>;
	getRepositoryByOwnerAndRepo(
		accessToken: string,
		owner: string,
		repo: string,
	): Promise<RepositoryInfo>;
	getAuthenticatedUserInfo(accessToken: string): Promise<{
		id: number;
		login: string;
		name: string | null;
		email: string | null;
		avatar_url: string | null;
	}>;
	listPullRequests(
		accessToken: string,
		owner: string,
		repo: string,
		options: {
			state?: "open" | "closed" | "all";
			per_page?: number;
			page?: number;
		},
	): Promise<GithubPullRequestSummary[]>;
}
