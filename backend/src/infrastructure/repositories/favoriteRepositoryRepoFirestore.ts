import type { FavoriteRepository } from "@prnews/common";
import type { DocumentSnapshot, Firestore } from "firebase-admin/firestore";
import type { FavoriteRepositoryRepoPort } from "../../ports/favoriteRepositoryRepoPort";

function favoriteFromDoc(doc: DocumentSnapshot): FavoriteRepository | null {
	if (!doc.exists) return null;
	const data = doc.data() as FavoriteRepository;
	return {
		id: data.id,
		userId: data.userId,
		githubRepoId: data.githubRepoId,
		repositoryFullName: data.repositoryFullName,
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
		if (!result) throw new Error("Failed to save favorite repository");
		return result;
	},
});
