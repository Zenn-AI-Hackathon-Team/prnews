import type { PullRequest } from "../domain/pullRequest.js";

export interface GithubPort {
	fetchPullRequest(
		owner: string,
		repo: string,
		number: number,
	): Promise<PullRequest>;
}
