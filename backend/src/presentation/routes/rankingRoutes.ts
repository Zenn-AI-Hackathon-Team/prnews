import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import {
	errorResponseSchema,
	rankedArticleInfoSchema,
	successResponseSchema,
} from "@prnews/common";
import type { Dependencies } from "../../config/di";

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
					schema: successResponseSchema(
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
	const { period, language, limit, offset } = c.req.valid("query");
	const numLimit = limit ? Number(limit) : undefined;
	const numOffset = offset ? Number(offset) : undefined;
	const { data, totalItems } = await rankingService.getArticleLikeRanking({
		period,
		language,
		limit: numLimit,
		offset: numOffset,
	});
	return c.json(
		{
			success: true as const,
			data: {
				data,
				pagination: {
					totalItems,
					limit: numLimit ?? 10,
					offset: numOffset ?? 0,
				},
			},
		},
		200,
	);
});

export default rankingRoutes;
