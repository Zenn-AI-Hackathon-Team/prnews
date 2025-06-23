import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import type { Firestore } from "firebase-admin/firestore";
import type { User } from "../../domain/user";
import type { UserRepoPort } from "../../ports/userRepoPort";
import { userRepoFirestore } from "./userRepoFirestore";

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

describe("userRepoFirestore", () => {
	let userRepo: UserRepoPort;

	beforeAll(() => {
		userRepo = userRepoFirestore(db);
	});

	// 各テストの後にFirestoreのデータを全削除する
	afterEach(async () => {
		const collections = await db.listCollections();
		for (const collection of collections) {
			const docs = await collection.listDocuments();
			await Promise.all(docs.map((doc) => doc.delete()));
		}
	});

	it("should save a user and find them by ID", async () => {
		// 1. 保存するテストデータから、値がundefinedになるキーを完全に削除する
		const userToSave = {
			id: "user-uuid-1",
			firebaseUid: "firebase-uid-1",
			githubUserId: 12345,
			githubUsername: "testuser",
			language: "ja",
			encryptedGitHubAccessToken: "encrypted-token-string",
		};

		// 2. データを保存
		await userRepo.save(userToSave as User); // saveメソッドの型(User)に合わせるためキャスト

		// 3. IDでデータを取得
		const foundUser = await userRepo.findById(userToSave.id);

		// 4. 検証
		expect(foundUser).not.toBeNull();
		// objectContaining を使って、保存したデータがちゃんと含まれているかを確認
		expect(foundUser).toEqual(expect.objectContaining(userToSave));
	});

	it("should return null if user is not found by ID", async () => {
		const foundUser = await userRepo.findById("non-existent-id");
		expect(foundUser).toBeNull();
	});
});
