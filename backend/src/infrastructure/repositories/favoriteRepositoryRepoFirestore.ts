import type { FavoriteRepository } from "@prnews/common";
import type { DocumentSnapshot, Firestore } from "firebase-admin/firestore";
import { HTTPException } from "hono/http-exception";
import type { FavoriteRepositoryRepoPort } from "../../ports/favoriteRepositoryRepoPort";

function favoriteFromDoc(doc: DocumentSnapshot): FavoriteRepository | null {
	if (!doc.exists) return null;
	const data = doc.data() as FavoriteRepository;
	return {
		id: data.id,
		userId: data.userId,
		githubRepoId: data.githubRepoId,
		owner: data.owner,
		repo: data.repo,
		registeredAt: data.registeredAt,
	};
}

export const favoriteRepositoryRepoFirestore = (
	db: Firestore,
): FavoriteRepositoryRepoPort => ({
	async findByUserIdAndGithubRepoId(userId, githubRepoId) {
		const snap = await db
			.collection(`users/${userId}/favoriteRepositories`)
			.where("githubRepoId", "==", githubRepoId)
			.limit(1)
			.get();
		if (snap.empty) return null;
		return favoriteFromDoc(snap.docs[0]);
	},
	async save(favorite) {
		await db
			.collection(`users/${favorite.userId}/favoriteRepositories`)
			.doc(favorite.id)
			.set(favorite, { merge: true });
		const saved = await db
			.collection(`users/${favorite.userId}/favoriteRepositories`)
			.doc(favorite.id)
			.get();
		const result = favoriteFromDoc(saved);
		if (!result)
			throw new HTTPException(500, {
				message: "Failed to save favorite repository",
			});
		return result;
	},
	async findById(favoriteId) {
		const snap = await db
			.collectionGroup("favoriteRepositories")
			.where("id", "==", favoriteId)
			.limit(1)
			.get();
		if (snap.empty) return null;
		return favoriteFromDoc(snap.docs[0]);
	},
	async delete(userId, favoriteId) {
		const docRef = db
			.collection(`users/${userId}/favoriteRepositories`)
			.doc(favoriteId);
		try {
			await docRef.delete();
			return true;
		} catch (error) {
			console.error("Failed to delete favorite repository:", error);
			return false;
		}
	},
	async findByUserId(userId, options) {
		const collectionRef = db.collection(`users/${userId}/favoriteRepositories`);
		const totalSnap = await collectionRef.count().get();
		const total = totalSnap.data().count;
		const favoritesSnap = await collectionRef
			.orderBy("registeredAt", "desc")
			.limit(options.limit)
			.offset(options.offset)
			.get();
		const favorites = favoritesSnap.docs
			.map(favoriteFromDoc)
			.filter((f) => !!f);
		return { favorites, total };
	},
});
