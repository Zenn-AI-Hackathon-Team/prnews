import type { PullRequest } from "../../domain/pullRequest.js";
import type { PullRequestArticle } from "../../domain/pullRequestArticle.js";
import type { PrRepoPort } from "../../ports/prRepoPort.js";

export const prRepoMemory = (): PrRepoPort => {
	const prs = new Map<string, PullRequest>();
	const arts = new Map<string, PullRequestArticle>();

	const makeKey = (o: string, r: string, n: number) => `${o}/${r}#${n}`;

	return {
		async savePullRequest(pr) {
			const [owner, repo] = pr.repository.split("/");
			prs.set(makeKey(owner, repo, pr.prNumber), pr);
		},

		async saveArticle(article) {
			const [owner, repo] = article.repository.split("/");
			arts.set(makeKey(owner, repo, article.prNumber), article);
		},

		async findByNumber(owner, repo, number) {
			return prs.get(makeKey(owner, repo, number)) ?? null;
		},

		async findByOwnerRepoNumber(owner, repo, prNumber) {
			const targetRepoFullName = `${owner}/${repo}`;
			for (const pr of prs.values()) {
				if (pr.repository === targetRepoFullName && pr.prNumber === prNumber) {
					return pr;
				}
			}
			return null;
		},

		async findArticleByPrId(prId) {
			return arts.get(prId) ?? null;
		},
	};
};
