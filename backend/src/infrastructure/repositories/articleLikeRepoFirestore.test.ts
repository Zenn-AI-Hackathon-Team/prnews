import type { ArticleLike } from "@prnews/common";
import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import type { Firestore } from "firebase-admin/firestore";
import type { ArticleLikeRepoPort } from "../../ports/articleLikeRepoPort";
import { articleLikeRepoFirestore } from "./articleLikeRepoFirestore";

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

describe("articleLikeRepoFirestore", () => {
	let likeRepo: ArticleLikeRepoPort;

	beforeAll(() => {
		likeRepo = articleLikeRepoFirestore(db);
	});

	afterEach(async () => {
		const collections = await db.listCollections();
		for (const collection of collections) {
			const docs = await collection.listDocuments();
			await Promise.all(docs.map((doc) => doc.delete()));
		}
	});

	it("should save an article like and find it by userId, articleId and languageCode", async () => {
		const testLike: ArticleLike = {
			id: "a1b2c3d4-5678-1234-9876-abcdefabcdef",
			userId: "u1b2c3d4-5678-1234-9876-abcdefabcdef",
			articleId: "ar1b2c3d4-5678-1234-9876-abcdefabcdef",
			languageCode: "ja",
			likedAt: new Date().toISOString(),
		};

		await likeRepo.save(testLike);
		const found = await likeRepo.findByUserIdAndArticleIdAndLang(
			testLike.userId,
			testLike.articleId,
			testLike.languageCode,
		);
		expect(found).not.toBeNull();
		expect(found).toEqual(testLike);
	});
});
