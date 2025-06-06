import type { DocumentSnapshot, Firestore } from "firebase-admin/firestore";
import type { User } from "../../domain/user";
import type { UserRepoPort } from "../../ports/userRepoPort";

const COLLECTION = "users";

function userFromDoc(doc: DocumentSnapshot): User | null {
	if (!doc.exists) return null;
	const data = doc.data() as User;
	return {
		id: data.id,
		githubUserId: data.githubUserId,
		githubUsername: data.githubUsername,
		language: data.language ?? "ja",
		firebaseUid: data.firebaseUid,
		githubDisplayName: data.githubDisplayName ?? null,
		email: data.email ?? null,
		avatarUrl: data.avatarUrl ?? null,
		createdAt: data.createdAt,
		updatedAt: data.updatedAt,
		encryptedGitHubAccessToken: data.encryptedGitHubAccessToken,
	};
}

export const userRepoFirestore = (db: Firestore): UserRepoPort => ({
	async save(user) {
		await db.collection(COLLECTION).doc(user.id).set(user, { merge: true });
		const saved = await db.collection(COLLECTION).doc(user.id).get();
		return userFromDoc(saved);
	},
	async findById(id) {
		const doc = await db.collection(COLLECTION).doc(id).get();
		return userFromDoc(doc);
	},
	async findByGithubUserId(githubUserId) {
		const snap = await db
			.collection(COLLECTION)
			.where("githubUserId", "==", githubUserId)
			.limit(1)
			.get();
		if (snap.empty) return null;
		return userFromDoc(snap.docs[0]);
	},
	async findByFirebaseUid(firebaseUid) {
		const snap = await db
			.collection(COLLECTION)
			.where("firebaseUid", "==", firebaseUid)
			.limit(1)
			.get();
		if (snap.empty) return null;
		return userFromDoc(snap.docs[0]);
	},
	async update(id, data) {
		const userRef = db.collection(COLLECTION).doc(id);
		await userRef.update({
			...data,
			updatedAt: new Date().toISOString(),
		});
		const updatedDoc = await userRef.get();
		return userFromDoc(updatedDoc);
	},
});
