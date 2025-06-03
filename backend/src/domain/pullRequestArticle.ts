import type { PullRequest } from "./pullRequest.js";

export type PullRequestArticle = PullRequest & {
	aiGeneratedTitle: string;
	backgroundAndPurpose?: string;
	mainChanges?: string;
	notablePoints?: string;
	summaryGeneratedAt: string;
};

export const createPullRequestArticle = (
	pr: PullRequest,
	extra: Omit<PullRequestArticle, keyof PullRequest | "id">,
): PullRequestArticle => ({
	...pr,
	...extra,
});
