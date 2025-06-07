import { FieldValue } from "firebase-admin/firestore";
import type {
	DocumentSnapshot,
	Firestore,
	Query,
} from "firebase-admin/firestore";
import type { PullRequestArticle } from "../../domain/pullRequestArticle";
import type { PrRepoPort } from "../../ports/prRepoPort";

const COLLECTION = "pullRequestArticles";

function articleFromDoc(doc: DocumentSnapshot): PullRequestArticle | null {
	if (!doc.exists) return null;
	return doc.data() as PullRequestArticle;
}

export const prRepoFirestore = (db: Firestore): PrRepoPort => ({
	async savePullRequest(pr) {
		// PR自体はarticleのidと同じidで保存
		await db.collection(COLLECTION).doc(pr.id).set(pr, { merge: true });
	},
	async saveArticle(article) {
		await db
			.collection(COLLECTION)
			.doc(article.id)
			.set(article, { merge: true });
	},
	async findByNumber(owner, repo, number) {
		const repoFull = `${owner}/${repo}`;
		const snap = await db
			.collection(COLLECTION)
			.where("repository", "==", repoFull)
			.where("prNumber", "==", number)
			.limit(1)
			.get();
		if (snap.empty) return null;
		// PR情報のみ返す
		const data = snap.docs[0].data();
		return {
			id: data.id,
			prNumber: data.prNumber,
			repository: data.repository,
			title: data.title,
			diff: data.diff,
			authorLogin: data.authorLogin,
			createdAt: data.createdAt,
			body: data.body,
			comments: data.comments,
		};
	},
	async findByOwnerRepoNumber(owner, repo, prNumber) {
		// findByNumberと同じ
		return await this.findByNumber(owner, repo, prNumber);
	},
	async findArticleByPrId(prId) {
		const doc = await db.collection(COLLECTION).doc(prId).get();
		return articleFromDoc(doc);
	},
	async incrementLikeCount(prId: string, lang: string, delta: number) {
		const ref = db.collection(COLLECTION).doc(prId);
		await db.runTransaction(async (tx) => {
			const doc = await tx.get(ref);
			if (!doc.exists) throw new Error("PR Article not found");
			const data = doc.data();
			if (!data || !data.contents || !data.contents[lang])
				throw new Error("Article content for language not found");
			tx.update(ref, {
				[`contents.${lang}.likeCount`]: FieldValue.increment(delta),
			});
		});
	},
	async getRanking({
		period = "all",
		language = "all",
		limit = 10,
		offset = 0,
	}: {
		period?: "weekly" | "monthly" | "all";
		language?: string;
		limit?: number;
		offset?: number;
	}): Promise<PullRequestArticle[]> {
		let query: Query = db.collection(COLLECTION);
		// 期間フィルタ
		if (period !== "all") {
			const now = new Date();
			let from: Date;
			if (period === "weekly") {
				from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
			} else {
				from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
			}
			query = query.where("createdAt", ">=", from.toISOString());
		}
		// 言語指定がある場合はその言語のlikeCountでorderBy
		if (language && language !== "all") {
			query = query.orderBy(`contents.${language}.likeCount`, "desc");
		}
		// ページング
		query = query.limit(limit + (offset || 0));
		const snap = await query.get();
		let articles: PullRequestArticle[] = snap.docs
			.map((doc) => articleFromDoc(doc))
			.filter((a): a is PullRequestArticle => !!a);
		// offset対応
		if (offset) articles = articles.slice(offset);
		// 全言語合算ランキングの場合は手動で合計likeCountでソート
		if (!language || language === "all") {
			type ArticleWithLike = PullRequestArticle & { _likeCount: number };
			const articlesWithLike: ArticleWithLike[] = articles.map((a) => ({
				...a,
				_likeCount: a.contents
					? Object.values(a.contents).reduce(
							(sum, c) => sum + ((c as { likeCount?: number }).likeCount || 0),
							0,
						)
					: 0,
			}));
			articlesWithLike.sort((a, b) => b._likeCount - a._likeCount);
			articles = articlesWithLike.map(
				({ _likeCount, ...rest }) => rest as PullRequestArticle,
			);
		}
		return articles;
	},
});
