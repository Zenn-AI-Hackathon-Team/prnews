import type { RankedArticleInfo } from "@prnews/common";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { RankingService } from "../../application/rankingService";
import rankingRoutes from "./rankingRoutes";

type TestVariables = {
	rankingService: jest.Mocked<RankingService>;
};

const rankedMock: RankedArticleInfo = {
	rank: 1,
	articleId: "00000000-0000-0000-0000-000000000001",
	languageCode: "ja",
	aiGeneratedTitle: "AIタイトル",
	repositoryFullName: "owner/repo",
	prNumber: 1,
	likeCount: 10,
};

describe("rankingRoutes", () => {
	let app: Hono<{ Variables: TestVariables }>;
	let mockRankingService: jest.Mocked<RankingService>;
	let errorSpy: jest.SpyInstance;

	beforeEach(() => {
		mockRankingService = {
			getArticleLikeRanking: jest.fn(),
			getUserRanking: jest.fn(),
		} as unknown as jest.Mocked<RankingService>;
		app = new Hono<{ Variables: TestVariables }>();
		app.onError((err, c) => {
			if (err instanceof HTTPException) {
				return c.json(
					{ code: "HTTP_EXCEPTION", message: err.message },
					err.status,
				);
			}
			return c.json(
				{ code: "INTERNAL_SERVER_ERROR", message: "Internal Server Error" },
				500,
			);
		});
		app.use("*", async (c, next) => {
			c.set("rankingService", mockRankingService);
			await next();
		});
		app.route("/", rankingRoutes);
		errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
	});

	afterEach(() => {
		errorSpy.mockRestore();
	});

	it("GET /ranking 正常系", async () => {
		mockRankingService.getArticleLikeRanking.mockResolvedValue({
			data: [rankedMock],
			totalItems: 1,
		});
		const req = new Request("http://localhost/ranking/articles/likes");
		const res = await app.request(req);
		const json = await res.json();
		expect(res.status).toBe(200);
		expect(json.success).toBe(true);
		expect(Array.isArray(json.data.data)).toBe(true);
		expect(json.data.data[0]).toEqual(rankedMock);
	});

	it("GET /ranking 異常系: サービスエラー", async () => {
		mockRankingService.getArticleLikeRanking.mockRejectedValue(
			new Error("fail"),
		);
		const req = new Request("http://localhost/ranking/articles/likes");
		const res = await app.request(req);
		const json = await res.json();
		expect(res.status).toBe(500);
		expect(json.code).toBe("INTERNAL_SERVER_ERROR");
		// messageも存在することを確認
		expect(typeof json.message).toBe("string");
	});
});
