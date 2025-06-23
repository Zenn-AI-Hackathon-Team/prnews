import type { ArticleLike } from "@prnews/common";
import type { DocumentSnapshot, Firestore } from "firebase-admin/firestore";
import { HTTPException } from "hono/http-exception";
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
	async findByUserIdAndArticleIdAndLang(userId, articleId, lang, tx) {
		const colRef = db.collection(COLLECTION);
		const query = colRef
			.where("userId", "==", userId)
			.where("articleId", "==", articleId)
			.where("languageCode", "==", lang)
			.limit(1);
		let snap: FirebaseFirestore.QuerySnapshot;
		if (tx) {
			snap = await tx.get(query);
		} else {
			snap = await query.get();
		}
		if (snap.empty) return null;
		return likeFromDoc(snap.docs[0]);
	},
	async save(like, tx) {
		const docRef = db.collection(COLLECTION).doc(like.id);
		if (tx) {
			tx.set(docRef, like, { merge: true });
			return like;
		}
		await docRef.set(like, { merge: true });
		const saved = await docRef.get();
		const result = likeFromDoc(saved);
		if (!result)
			throw new HTTPException(500, { message: "Failed to save article like" });
		return result;
	},
	async deleteByUserIdAndArticleIdAndLang(userId, articleId, lang, tx) {
		const colRef = db.collection(COLLECTION);
		const query = colRef
			.where("userId", "==", userId)
			.where("articleId", "==", articleId)
			.where("languageCode", "==", lang)
			.limit(1);
		let snap: FirebaseFirestore.QuerySnapshot;
		if (tx) {
			snap = await tx.get(query);
		} else {
			snap = await query.get();
		}
		if (snap.empty) return false;
		const docRef = colRef.doc(snap.docs[0].id);
		if (tx) {
			tx.delete(docRef);
			return true;
		}
		await docRef.delete();
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
