import type { ArticleLike } from "@prnews/common";
import type { DocumentSnapshot, Firestore } from "firebase-admin/firestore";
import type { ArticleLikeRepoPort } from "../../ports/articleLikeRepoPort";

const COLLECTION = "articleLikes";

function likeFromDoc(doc: DocumentSnapshot): ArticleLike | null {
	if (!doc.exists) return null;
	const data = doc.data() as ArticleLike;
	return {
		id: data.id,
		userId: data.userId,
		articleId: data.articleId,
		languageCode: data.languageCode,
		likedAt: data.likedAt,
	};
}

export const articleLikeRepoFirestore = (
	db: Firestore,
): ArticleLikeRepoPort => ({
	async findByUserIdAndArticleIdAndLang(userId, articleId, lang) {
		const snap = await db
			.collection(COLLECTION)
			.where("userId", "==", userId)
			.where("articleId", "==", articleId)
			.where("languageCode", "==", lang)
			.limit(1)
			.get();
		if (snap.empty) return null;
		return likeFromDoc(snap.docs[0]);
	},
	async save(like) {
		await db.collection(COLLECTION).doc(like.id).set(like, { merge: true });
		const saved = await db.collection(COLLECTION).doc(like.id).get();
		const result = likeFromDoc(saved);
		if (!result) throw new Error("Failed to save article like");
		return result;
	},
	async deleteByUserIdAndArticleIdAndLang(userId, articleId, lang) {
		const snap = await db
			.collection(COLLECTION)
			.where("userId", "==", userId)
			.where("articleId", "==", articleId)
			.where("languageCode", "==", lang)
			.limit(1)
			.get();
		if (snap.empty) return false;
		await db.collection(COLLECTION).doc(snap.docs[0].id).delete();
		return true;
	},
	async findByUserId(userId) {
		const snap = await db
			.collection(COLLECTION)
			.where("userId", "==", userId)
			.get();
		return snap.docs.map(likeFromDoc).filter((l): l is ArticleLike => !!l);
	},
});
