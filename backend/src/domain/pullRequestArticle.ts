import type { PullRequest } from "./pullRequest.js";

export type ArticleContent = {
	aiGeneratedTitle: string;
	backgroundAndPurpose?: string;
	mainChanges?: {
		fileName: string;
		changeTypes: string[];
		description: string;
	}[];
	notablePoints?: {
		categories: string[];
		point: string;
	}[];
	summaryGeneratedAt: string;
	likeCount: number;
};

export type PullRequestArticle = PullRequest & {
	contents?: Record<string, ArticleContent>;
	totalLikeCount?: number;
	createdAt?: string;
	updatedAt?: string;
};

export const createPullRequestArticle = (
	pr: PullRequest,
	extra: Omit<PullRequestArticle, keyof PullRequest | "id">,
): PullRequestArticle => ({
	...pr,
	...extra,
});
