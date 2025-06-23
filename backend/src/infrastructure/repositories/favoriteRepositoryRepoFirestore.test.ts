import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import type { Firestore } from "firebase-admin/firestore";
import type { FavoriteRepositoryRepoPort } from "../../ports/favoriteRepositoryRepoPort";
import { favoriteRepositoryRepoFirestore } from "./favoriteRepositoryRepoFirestore";

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

describe("favoriteRepositoryRepoFirestore", () => {
	let favoriteRepo: FavoriteRepositoryRepoPort;

	beforeAll(() => {
		favoriteRepo = favoriteRepositoryRepoFirestore(db);
	});

	afterEach(async () => {
		const collections = await db.listCollections();
		for (const collection of collections) {
			const docs = await collection.listDocuments();
			await Promise.all(docs.map((doc) => doc.delete()));
		}
	});

	// it("should save a favorite repository and find it by userId and githubRepoId", async () => {
	// 	const testFavorite: FavoriteRepository = {
	// 		id: "f1b2c3d4-5678-1234-9876-abcdefabcdef",
	// 		userId: "u1b2c3d4-5678-1234-9876-abcdefabcdef",
	// 		githubRepoId: 123456,
	// 		owner: "test-owner",
	// 		repo: "test-repo",
	// 		registeredAt: new Date().toISOString(),
	// 	};

	// 	await favoriteRepo.save(testFavorite);
	// 	const found = await favoriteRepo.findByUserIdAndGithubRepoId(
	// 		testFavorite.userId,
	// 		testFavorite.githubRepoId,
	// 	);
	// 	expect(found).not.toBeNull();
	// 	expect(found).toEqual(testFavorite);
	// });

	jest.setTimeout(20000);
});
