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
	description: `\
指定期間・言語ごとのPullRequest記事のいいね数ランキングを返します。
- 期間（weekly/monthly/all）、言語、ページネーション指定可。
`,
	tags: ["Ranking"],
	request: {
		query: z.object({
			period: z.enum(["weekly", "monthly", "all"]).optional().openapi({
				description: "集計期間（weekly:週間, monthly:月間, all:全期間）",
				example: "weekly",
			}),
			language: z.string().optional().openapi({
				description: "言語コード（例: 'ja'）",
				example: "ja",
			}),
			limit: z.string().optional().openapi({
				description: "取得件数",
				example: "10",
			}),
			offset: z.string().optional().openapi({
				description: "オフセット（スキップ件数）",
				example: "0",
			}),
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
					example: {
						success: true,
						data: {
							data: [
								{ id: "article1", title: "AI解説", lang: "ja", likeCount: 42 },
							],
							pagination: { totalItems: 1, limit: 10, offset: 0 },
						},
					},
				},
			},
		},
		500: {
			description: "サーバーエラー。ランキング取得失敗など。",
			content: {
				"application/json": {
					schema: errorResponseSchema,
					example: {
						code: "INTERNAL_SERVER_ERROR",
						message: "Internal Server Error",
					},
				},
			},
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
