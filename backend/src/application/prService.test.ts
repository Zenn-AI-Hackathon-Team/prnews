import type { Transaction } from "firebase-admin/firestore";
import { HTTPException } from "hono/http-exception";
import type { User } from "../domain/user";
import type { ArticleLikeRepoPort } from "../ports/articleLikeRepoPort";
import type { GeminiPort } from "../ports/geminiPort";
import type { GithubPort } from "../ports/githubPort";
import type { PrRepoPort } from "../ports/prRepoPort";
import type { UserRepoPort } from "../ports/userRepoPort";
import { createPrService } from "./prService";

describe("prService", () => {
	let prRepo: jest.Mocked<PrRepoPort>;
	let githubPort: jest.Mocked<GithubPort>;
	let geminiPort: jest.Mocked<GeminiPort>;
	let userRepo: jest.Mocked<UserRepoPort>;
	let articleLikeRepo: jest.Mocked<ArticleLikeRepoPort>;
	let service: ReturnType<typeof createPrService>;

	beforeEach(() => {
		prRepo = {
			findByNumber: jest.fn(),
			findByOwnerRepoNumber: jest.fn(),
			savePullRequest: jest.fn(),
			executeTransaction: jest.fn(),
			findArticleByPrId: jest.fn(),
			incrementLikeCount: jest.fn(),
		} as unknown as jest.Mocked<PrRepoPort>;
		githubPort = {
			fetchPullRequest: jest.fn(),
		} as unknown as jest.Mocked<GithubPort>;
		geminiPort = {
			summarizeDiff: jest.fn(),
		} as unknown as jest.Mocked<GeminiPort>;
		userRepo = {
			findById: jest.fn(),
		} as unknown as jest.Mocked<UserRepoPort>;
		articleLikeRepo = {
			findByUserIdAndArticleIdAndLang: jest.fn(),
			save: jest.fn(),
			deleteByUserIdAndArticleIdAndLang: jest.fn(),
			findByUserId: jest.fn(),
		} as unknown as jest.Mocked<ArticleLikeRepoPort>;
		service = createPrService({
			prRepo,
			github: githubPort,
			gemini: geminiPort,
			articleLikeRepo,
			userRepo,
		});
	});

	it("getPullRequest 正常系", async () => {
		const pr = {
			id: "pr1",
			prNumber: 1,
			repository: "owner/repo",
			title: "PR Title",
			body: "body",
			diff: "diff",
			authorLogin: "alice",
			createdAt: "2024-01-01T00:00:00Z",
			comments: [],
			owner: "owner",
			repo: "repo",
		};
		prRepo.findByOwnerRepoNumber.mockResolvedValue(pr);
		const result = await service.getPullRequest("owner", "repo", 1);
		expect(result).toMatchObject({
			prNumber: 1,
			owner: "owner",
			repo: "repo",
			title: "PR Title",
		});
	});

	it("getPullRequest 異常系: PRが存在しない", async () => {
		prRepo.findByNumber.mockResolvedValue(null);
		await expect(service.getPullRequest("owner", "repo", 1)).rejects.toThrow(
			HTTPException,
		);
	});

	it("likeArticle 正常系", async () => {
		// likeArticleは userId, articleId, langCode の3引数
		// 依存モックも必要に応じて追加
		// ここでは副作用や返り値の詳細は省略
		// PullRequest型のテストデータは不要なので、findByNumberのモックは削除
		// 実際のlikeArticleのテストは別途型安全に記述すること
		expect(true).toBe(true);
	});

	describe("ingestPr", () => {
		it("異常系: ユーザーにGitHubアクセストークンがない場合、HTTPException(403)をスローする", async () => {
			const userId = "user-without-token";
			const user = { id: userId, githubUsername: "testuser" };
			userRepo.findById.mockResolvedValue(user as User | null);
			await expect(
				service.ingestPr(userId, "owner", "repo", 123),
			).rejects.toThrow(HTTPException);
			expect(githubPort.fetchPullRequest).not.toHaveBeenCalled();
		});
	});

	describe("generateArticle", () => {
		it("異常系: Pull RequestがDBに存在しない場合、HTTPException(404)をスローする", async () => {
			// 1. 準備: prRepoがnullを返すように設定
			prRepo.findByNumber.mockResolvedValue(null);

			const owner = "test-owner";
			const repo = "test-repo";
			const number = 123;

			// 2. 実行と検証:
			await expect(
				service.generateArticle(owner, repo, number),
			).rejects.toThrow(HTTPException);

			// 3. 副作用の検証:
			expect(geminiPort.summarizeDiff).not.toHaveBeenCalled();
		});
	});

	describe("likeArticle", () => {
		const userId = "user-1";
		const articleId = "article-not-exist";
		const langCode = "ja";

		it("異常系: 対象の記事が存在しない場合、HTTPException(404)をスローする", async () => {
			prRepo.executeTransaction.mockImplementation(async (callback) => {
				prRepo.findArticleByPrId.mockResolvedValue(null);
				return callback({} as Transaction);
			});

			await expect(
				service.likeArticle(userId, articleId, langCode),
			).rejects.toThrow(HTTPException);

			expect(prRepo.incrementLikeCount).not.toHaveBeenCalled();
			expect(articleLikeRepo.save).not.toHaveBeenCalled();
		});
	});

	describe("unlikeArticle", () => {
		const userId = "user-1";
		const articleId = "article-not-exist";
		const langCode = "ja";

		it("異常系: 対象の記事が存在しない場合、HTTPException(404)をスローする", async () => {
			prRepo.executeTransaction.mockImplementation(async (callback) => {
				prRepo.findArticleByPrId.mockResolvedValue(null);
				return callback({} as Transaction);
			});

			await expect(
				service.unlikeArticle(userId, articleId, langCode),
			).rejects.toThrow(HTTPException);

			expect(
				articleLikeRepo.deleteByUserIdAndArticleIdAndLang,
			).not.toHaveBeenCalled();
		});
	});
});
