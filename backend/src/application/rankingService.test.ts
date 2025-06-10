import { HTTPException } from "hono/http-exception";
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
				id: "11111111-1111-1111-1111-111111111111",
				contents: {
					ja: {
						aiGeneratedTitle: "AIによるテストタイトル",
						summaryGeneratedAt: new Date().toISOString(),
						likeCount: 10,
					},
				},
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
		expect(result.data[0].articleId).toBe(
			"11111111-1111-1111-1111-111111111111",
		);
	});

	it("getArticleLikeRanking 異常系: リポジトリエラー", async () => {
		prRepo.getRanking.mockImplementation(() => {
			throw new HTTPException(500, { message: "db error" });
		});
		await expect(service.getArticleLikeRanking()).rejects.toThrow("db error");
	});
});
