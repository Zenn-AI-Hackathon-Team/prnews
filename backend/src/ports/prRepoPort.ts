import type { PullRequest } from "../domain/pullRequest.js";
import type { PullRequestArticle } from "../domain/pullRequestArticle.js";

export interface PrRepoPort {
	savePullRequest(pr: PullRequest): Promise<void>;
	saveArticle(article: PullRequestArticle): Promise<void>;
	findByNumber(
		owner: string,
		repo: string,
		number: number,
	): Promise<PullRequest | null>;
}
