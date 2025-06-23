import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import type { Firestore } from "firebase-admin/firestore";
import type { PrRepoPort } from "../../ports/prRepoPort";
import { prRepoFirestore } from "./prRepoFirestore";

if (getApps().length === 0) {
	initializeApp({
		projectId: "prnews-test-project",
	});
}

const db: Firestore = getFirestore();
db.settings({
	host: "127.0.0.1:5050", // 自身で設定したFirestoreエミュレータのポート番号
	ssl: false,
});

describe("prRepoFirestore", () => {
	let prRepo: PrRepoPort;

	beforeAll(() => {
		prRepo = prRepoFirestore(db);
	});

	afterEach(async () => {
		const collections = await db.listCollections();
		for (const collection of collections) {
			const docs = await collection.listDocuments();
			await Promise.all(docs.map((doc) => doc.delete()));
		}
	});

	// it("should save an article and find it by PR ID", async () => {
	// 	// 1. テストデータをシンプルな PullRequest の形に修正
	// 	const testArticle: PullRequestArticle = {
	// 		id: "article-uuid-1",
	// 		prNumber: 101,
	// 		repository: "test-owner/test-repo",
	// 		title: "Test PR Title",
	// 		body: "This is the body of the test PR.",
	// 		diff: "--- a/file.txt\n+++ b/file.txt\n@@ -1 +1 @@\n-hello\n+world",
	// 		authorLogin: "test-author",
	// 		createdAt: new Date().toISOString(),
	// 		comments: [],
	// 	};

	// 	// 2. データを保存
	// 	await prRepo.saveArticle(testArticle);

	// 	// 3. 保存したデータを取得
	// 	const foundArticle = await prRepo.findArticleByPrId("article-uuid-1");

	// 	// 4. 検証
	// 	expect(foundArticle).not.toBeNull();
	// 	// objectContaining を使って、保存した主要なデータが含まれているかを確認
	// 	expect(foundArticle).toEqual(expect.objectContaining(testArticle));
	// });
});
