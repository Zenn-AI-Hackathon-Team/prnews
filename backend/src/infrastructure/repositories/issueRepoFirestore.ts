import type { IssueArticle } from "@prnews/common";
import type { DocumentSnapshot, Firestore } from "firebase-admin/firestore";
import type { IssueRepoPort } from "../../ports/issueRepoPort";

const COLLECTION = "issueArticles";

function articleFromDoc(doc: DocumentSnapshot): IssueArticle | null {
	if (!doc.exists) return null;
	return doc.data() as IssueArticle;
}

export const issueRepoFirestore = (db: Firestore): IssueRepoPort => ({
	async saveArticle(article: IssueArticle) {
		await db
			.collection(COLLECTION)
			.doc(article.id)
			.set(article, { merge: true });
	},

	async findByNumber(owner: string, repo: string, issueNumber: number) {
		const repoFull = `${owner}/${repo}`;
		const snap = await db
			.collection(COLLECTION)
			.where("repositoryFullName", "==", repoFull)
			.where("issueNumber", "==", issueNumber)
			.limit(1)
			.get();
		if (snap.empty) return null;
		return articleFromDoc(snap.docs[0]);
	},

	async findArticleById(
		articleId: string,
		tx?: import("firebase-admin/firestore").Transaction,
	) {
		const docRef = db.collection(COLLECTION).doc(articleId);
		const doc = tx ? await tx.get(docRef) : await docRef.get();
		return articleFromDoc(doc);
	},

	async checkArticlesExist(
		owner: string,
		repo: string,
		issueNumbers: number[],
	) {
		if (!issueNumbers || issueNumbers.length === 0) {
			return [];
		}
		const repoFull = `${owner}/${repo}`;
		const BATCH_SIZE = 30;
		const existingNumbers: number[] = [];

		for (let i = 0; i < issueNumbers.length; i += BATCH_SIZE) {
			const batchNumbers = issueNumbers.slice(i, i + BATCH_SIZE);
			const snap = await db
				.collection(COLLECTION)
				.where("repositoryFullName", "==", repoFull)
				.where("issueNumber", "in", batchNumbers)
				.get();

			if (!snap.empty) {
				const numbers = snap.docs.map(
					(doc) => doc.data().issueNumber as number,
				);
				existingNumbers.push(...numbers);
			}
		}
		return existingNumbers;
	},
});
