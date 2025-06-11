import type { AuthSession } from "@prnews/common";
import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import type { Firestore } from "firebase-admin/firestore";
import type { AuthSessionRepoPort } from "../../ports/authSessionRepoPort";
import { authSessionRepoFirestore } from "./authSessionRepoFirestore";

if (getApps().length === 0) {
	initializeApp({
		projectId: "prnews-test-project",
	});
}

const db: Firestore = getFirestore();
db.settings({
	host: "127.0.0.1:5050",
	ssl: false,
});

describe("authSessionRepoFirestore", () => {
	let sessionRepo: AuthSessionRepoPort;

	beforeAll(() => {
		sessionRepo = authSessionRepoFirestore(db);
	});

	afterEach(async () => {
		const collections = await db.listCollections();
		for (const collection of collections) {
			const docs = await collection.listDocuments();
			await Promise.all(docs.map((doc) => doc.delete()));
		}
	});

	it("should save an auth session and find it by firebaseUid (active session)", async () => {
		const testSession: AuthSession = {
			id: "s1b2c3d4-5678-1234-9876-abcdefabcdef",
			userId: "u1b2c3d4-5678-1234-9876-abcdefabcdef",
			firebaseUid: "firebase-uid-1",
			tokenHash:
				"0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
			expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
			createdAt: new Date().toISOString(),
			revokedAt: undefined,
		};

		await sessionRepo.save(testSession);
		const found = await sessionRepo.findByFirebaseUidActiveSession(
			testSession.firebaseUid,
		);
		expect(found).not.toBeNull();
		if (found) {
			expect(found.revokedAt).toBeUndefined();
		}
		expect(found).toEqual(testSession);
	});
});
