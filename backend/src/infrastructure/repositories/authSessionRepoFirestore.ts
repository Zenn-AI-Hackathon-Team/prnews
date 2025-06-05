import type { AuthSession } from "@prnews/common";
import type { DocumentSnapshot, Firestore } from "firebase-admin/firestore";
import type { AuthSessionRepoPort } from "../../ports/authSessionRepoPort";

const COLLECTION = "authSessions";

function sessionFromDoc(doc: DocumentSnapshot): AuthSession | null {
	if (!doc.exists) return null;
	const data = doc.data() as AuthSession;
	return {
		id: data.id,
		userId: data.userId,
		firebaseUid: data.firebaseUid,
		tokenHash: data.tokenHash,
		expiresAt: data.expiresAt,
		createdAt: data.createdAt,
		revokedAt: data.revokedAt ?? undefined,
	};
}

function normalizeSession(session: AuthSession): AuthSession {
	return {
		...session,
		revokedAt: session.revokedAt ?? null,
	};
}

export const authSessionRepoFirestore = (
	db: Firestore,
): AuthSessionRepoPort => ({
	async save(session) {
		const norm = normalizeSession(session);
		try {
			await db.collection(COLLECTION).doc(norm.id).set(norm, { merge: true });
			const saved = await db.collection(COLLECTION).doc(norm.id).get();
			return sessionFromDoc(saved);
		} catch (e) {
			console.error(
				"[authSessionRepoFirestore] Firestore save error:",
				e,
				norm,
			);
			return null;
		}
	},
	async findByFirebaseUidActiveSession(firebaseUid) {
		const snap = await db
			.collection(COLLECTION)
			.where("firebaseUid", "==", firebaseUid)
			.get();
		if (snap.empty) return null;
		const doc = snap.docs.find((d) => {
			const data = d.data();
			return data.revokedAt === undefined || data.revokedAt === null;
		});
		return doc ? sessionFromDoc(doc) : null;
	},
	async update(session) {
		const norm = normalizeSession(session);
		const ref = db.collection(COLLECTION).doc(norm.id);
		await ref.set(norm, { merge: true });
		const updated = await ref.get();
		return sessionFromDoc(updated);
	},
});
