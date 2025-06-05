import type { PullRequest } from "../domain/pullRequest.js";
import type { RepositoryInfo } from "../domain/repository.js";

export interface GithubPort {
	fetchPullRequest(
		owner: string,
		repo: string,
		number: number,
	): Promise<PullRequest>;
	getRepositoryByOwnerAndRepo(
		owner: string,
		repo: string,
	): Promise<RepositoryInfo>;
}
