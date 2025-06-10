import { randomUUID } from "node:crypto";
import type { PullRequest } from "../../domain/pullRequest.js";
import type { PullRequestArticle } from "../../domain/pullRequestArticle.js";
import type { PrRepoPort } from "../../ports/prRepoPort.js";

export const prRepoMemory = (): PrRepoPort => {
	const prs = new Map<string, PullRequest & { id: string }>();
	const arts = new Map<string, PullRequestArticle>();

	const makeKey = (o: string, r: string, n: number) => `${o}/${r}#${n}`;

	return {
		async savePullRequest(pr) {
			const [owner, repo] = pr.repository.split("/");
			const key = makeKey(owner, repo, pr.prNumber);
			const id = prs.get(key)?.id || randomUUID();
			console.log(
				"[savePullRequest] owner:",
				owner,
				"repo:",
				repo,
				"prNumber:",
				pr.prNumber,
				"key:",
				key,
				"id:",
				id,
			);
			prs.set(key, { ...pr, id });
		},

		async saveArticle(article) {
			const [owner, repo] = article.repository.split("/");
			const prKey = makeKey(owner, repo, article.prNumber);
			const pr = prs.get(prKey);
			console.log(
				"[saveArticle] owner:",
				owner,
				"repo:",
				repo,
				"prNumber:",
				article.prNumber,
				"prKey:",
				prKey,
				"pr:",
				pr,
			);
			if (!pr) {
				throw new Error("PR not found for this article");
			}
			const id = pr.id;
			const articleWithId = { ...article, id };
			arts.set(id, articleWithId);
		},

		async findByNumber(owner, repo, number) {
			const key = makeKey(owner, repo, number);
			const pr = prs.get(key) ?? null;
			console.log(
				"[findByNumber] owner:",
				owner,
				"repo:",
				repo,
				"number:",
				number,
				"key:",
				key,
				"pr:",
				pr,
			);
			return pr;
		},

		async findByOwnerRepoNumber(owner, repo, prNumber) {
			const key = makeKey(owner, repo, prNumber);
			const pr = prs.get(key) ?? null;
			console.log(
				"[findByOwnerRepoNumber] owner:",
				owner,
				"repo:",
				repo,
				"prNumber:",
				prNumber,
				"key:",
				key,
				"pr:",
				pr,
			);
			return pr;
		},

		async findArticleByPrId(prId) {
			const article = arts.get(prId) ?? null;
			console.log("[findArticleByPrId] prId:", prId, "article:", article);
			return article;
		},

		async incrementLikeCount(prId, lang, delta) {
			// ダミー: 何もしない
			return;
		},

		async getRanking({
			period = "all",
			language = "all",
			limit = 10,
			offset = 0,
		}) {
			// ダミー: 全件返す（本番では使われない想定）
			let articles = Array.from(arts.values());
			if (language !== "all") {
				articles = articles.filter((a) => a.contents?.[language]);
			}
			if (offset) articles = articles.slice(offset);
			return articles.slice(0, limit);
		},
	};
};
