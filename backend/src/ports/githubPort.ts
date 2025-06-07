import type { PullRequest } from "../domain/pullRequest.js";
import type { RepositoryInfo } from "../domain/repository.js";

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
}
