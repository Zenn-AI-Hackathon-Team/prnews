import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import {
	ErrorCode,
	apiResponseSchema,
	errorResponseSchema,
	rankedArticleInfoSchema,
} from "@prnews/common";
import type { Dependencies } from "../../config/di";
import {
	respondOpenApiError,
	respondOpenApiSuccess,
} from "../../utils/apiResponder";

const rankingRoutes = new OpenAPIHono<{ Variables: Dependencies }>();

const getArticleLikeRankingRoute = createRoute({
	method: "get",
	path: "/ranking/articles/likes",
	summary: "記事いいねランキング取得",
	description: "指定期間・言語のPullRequest記事のいいね数ランキングを返す。",
	tags: ["Ranking"],
	request: {
		query: z.object({
			period: z.enum(["weekly", "monthly", "all"]).optional(),
			language: z.string().optional(),
			limit: z.string().optional(),
			offset: z.string().optional(),
		}),
	},
	responses: {
		200: {
			description: "ランキング取得成功",
			content: {
				"application/json": {
					schema: apiResponseSchema(
						z.object({
							data: z.array(rankedArticleInfoSchema),
							pagination: z.object({
								totalItems: z.number(),
								limit: z.number(),
								offset: z.number(),
							}),
						}),
					),
				},
			},
		},
		500: {
			description: "サーバーエラー",
			content: { "application/json": { schema: errorResponseSchema } },
		},
	},
});

rankingRoutes.openapi(getArticleLikeRankingRoute, async (c) => {
	const { rankingService } = c.var;
	try {
		const { period, language, limit, offset } = c.req.valid("query");
		const numLimit = limit ? Number(limit) : undefined;
		const numOffset = offset ? Number(offset) : undefined;
		const { data, totalItems } = await rankingService.getArticleLikeRanking({
			period,
			language,
			limit: numLimit,
			offset: numOffset,
		});
		return respondOpenApiSuccess(
			c,
			{
				data,
				pagination: {
					totalItems,
					limit: numLimit ?? 10,
					offset: numOffset ?? 0,
				},
			},
			200,
		);
	} catch (e) {
		return respondOpenApiError(
			c,
			{
				code: ErrorCode.INTERNAL_SERVER_ERROR,
				message: "ランキング取得に失敗しました",
			},
			200,
		);
	}
});

export default rankingRoutes;
