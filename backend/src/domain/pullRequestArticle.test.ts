import type { PullRequest } from "./pullRequest";
import { createPullRequestArticle } from "./pullRequestArticle";
import type { PullRequestArticle } from "./pullRequestArticle";

describe("createPullRequestArticle", () => {
	it("PullRequestとextra情報を合成してPullRequestArticleを生成できる", () => {
		const basePR: PullRequest = {
			id: "pr-id-002",
			prNumber: 456,
			repository: "test-owner/test-repo-2",
			title: "Refactor database module",
			body: "Refactoring for performance.",
			diff: "...",
			authorLogin: "refactor-dev",
			createdAt: new Date().toISOString(),
			comments: [],
		};

		const extraInfo: Omit<PullRequestArticle, keyof PullRequest | "id"> = {
			contents: {
				ja: {
					aiGeneratedTitle: "データベースモジュールの大規模リファクタリング",
					summaryGeneratedAt: new Date().toISOString(),
					likeCount: 0,
				},
			},
			totalLikeCount: 0,
			updatedAt: new Date().toISOString(),
		};

		const article = createPullRequestArticle(basePR, extraInfo);

		const expectedArticle: PullRequestArticle = {
			...basePR,
			...extraInfo,
		};

		expect(article).toEqual(expectedArticle);
		expect(article.prNumber).toBe(456);
		expect(article.contents?.ja?.aiGeneratedTitle).toBe(
			"データベースモジュールの大規模リファクタリング",
		);
	});
});
