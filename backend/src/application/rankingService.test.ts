import type { ArticleLikeRepoPort } from "../ports/articleLikeRepoPort";
import type { PrRepoPort } from "../ports/prRepoPort";
import { createRankingService } from "./rankingService";

describe("rankingService", () => {
	let prRepo: jest.Mocked<PrRepoPort>;
	let articleLikeRepo: jest.Mocked<ArticleLikeRepoPort>;
	let service: ReturnType<typeof createRankingService>;

	beforeEach(() => {
		prRepo = {
			getRanking: jest.fn(),
		} as unknown as jest.Mocked<PrRepoPort>;
		articleLikeRepo = {
			// 必要なメソッドを追加
		} as unknown as jest.Mocked<ArticleLikeRepoPort>;
		service = createRankingService({ prRepo, articleLikeRepo });
	});

	it("getArticleLikeRanking 正常系", async () => {
		prRepo.getRanking.mockResolvedValue([
			{
				id: "pr1",
				contents: {},
				prNumber: 1,
				repository: "",
				title: "",
				diff: "",
				authorLogin: "",
				createdAt: "",
				body: "",
				comments: [],
			},
		]);
		const result = await service.getArticleLikeRanking();
		expect(Array.isArray(result.data)).toBe(true);
		expect(result.data[0].articleId).toBe("pr1");
	});

	it("getArticleLikeRanking 異常系: リポジトリエラー", async () => {
		prRepo.getRanking.mockImplementation(() => {
			throw new Error("db error");
		});
		await expect(service.getArticleLikeRanking()).rejects.toThrow("db error");
	});
});
