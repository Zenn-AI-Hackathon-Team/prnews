import { createRoute, z } from "@hono/zod-openapi";
import { errorResponseSchema, successResponseSchema } from "@prnews/common";
import { createApp } from "../hono-app";

const generalRoutes = createApp();

// レスポンスの "data" プロパティに入る部分のスキーマを定義
const healthzResponseDataSchema = z.object({
	ok: z.boolean().openapi({ description: "ヘルスチェック結果 (true=正常)" }),
});

// APIルートの定義
const healthzRoute = createRoute({
	method: "get",
	path: "/healthz",
	summary: "ヘルスチェック",
	description: `\
サービスの稼働状況を確認します。コンテナやロードバランサのliveness/readiness probe用途にも利用できます。
`,
	tags: ["General"],
	responses: {
		200: {
			description: "サービス正常稼働",
			content: {
				"application/json": {
					schema: successResponseSchema(healthzResponseDataSchema),
					example: { success: true, data: { ok: true } },
				},
			},
		},
		500: {
			description: "サーバー内部エラー。ヘルスチェック失敗など。",
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

generalRoutes.openapi(healthzRoute, async (c) => {
	const { generalService } = c.var;
	const healthStatus = await generalService.checkHealth();
	return c.json({ success: true as const, data: healthStatus }, 200);
});

export default generalRoutes;
