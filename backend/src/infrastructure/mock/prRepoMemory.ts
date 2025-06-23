import type { PullRequest } from "../../domain/pullRequest.js";
import type { PullRequestArticle } from "../../domain/pullRequestArticle.js";

export const prRepoMemory = () => {
	const prs = new Map<string, PullRequest & { id: string }>();
	const arts = new Map<string, PullRequestArticle>();

	return;
};
