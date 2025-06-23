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
			owner,
			repo,
		};
	},
	async findByOwnerRepoNumber(owner, repo, prNumber) {
		// findByNumberと同じ
		return await this.findByNumber(owner, repo, prNumber);
	},
	async findArticleByPrId(
		prId: string,
		tx?: import("firebase-admin/firestore").Transaction,
	) {
		const docRef = db.collection(COLLECTION).doc(prId);
		const doc = tx ? await tx.get(docRef) : await docRef.get();
		return articleFromDoc(doc);
	},
	async incrementLikeCount(
		prId: string,
		lang: string,
		delta: number,
		tx?: import("firebase-admin/firestore").Transaction,
	) {
		const ref = db.collection(COLLECTION).doc(prId);
		const updatePayload = {
			[`contents.${lang}.likeCount`]: FieldValue.increment(delta),
			totalLikeCount: FieldValue.increment(delta),
		};
		if (tx) {
			tx.update(ref, updatePayload);
		} else {
			await ref.update(updatePayload);
		}
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
		} else {
			// "all" または指定なしの場合は totalLikeCount でソート
			query = query.orderBy("totalLikeCount", "desc");
		}
		// ページング
		query = query.limit(limit + (offset || 0));
		const snap = await query.get();
		let articles: PullRequestArticle[] = snap.docs
			.map((doc) => articleFromDoc(doc))
			.filter((a): a is PullRequestArticle => !!a);
		// offset対応
		if (offset) articles = articles.slice(offset);
		return articles;
	},
	async findArticlesByIds(ids: string[]): Promise<PullRequestArticle[]> {
		if (!ids || ids.length === 0) return [];
		const BATCH_SIZE = 30;
		const results: PullRequestArticle[] = [];
		for (let i = 0; i < ids.length; i += BATCH_SIZE) {
			const batchIds = ids.slice(i, i + BATCH_SIZE);
			const snap = await db
				.collection(COLLECTION)
				.where("id", "in", batchIds)
				.get();
			const articles = snap.docs
				.map((doc) => articleFromDoc(doc))
				.filter((a): a is PullRequestArticle => !!a);
			results.push(...articles);
		}
		return results;
	},
	async checkArticlesExist(owner, repo, prNumbers) {
		if (!prNumbers || prNumbers.length === 0) return [];
		const repoFull = `${owner}/${repo}`;
		const BATCH_SIZE = 30;
		const exists: number[] = [];
		for (let i = 0; i < prNumbers.length; i += BATCH_SIZE) {
			const batchNumbers = prNumbers.slice(i, i + BATCH_SIZE);
			const snap = await db
				.collection(COLLECTION)
				.where("repository", "==", repoFull)
				.where("prNumber", "in", batchNumbers)
				.get();
			exists.push(...snap.docs.map((doc) => doc.data().prNumber));
		}
		return exists;
	},
	executeTransaction: async <T>(
		operation: (
			tx: import("firebase-admin/firestore").Transaction,
		) => Promise<T>,
	): Promise<T> => {
		return db.runTransaction(operation);
	},
});
