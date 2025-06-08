import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import {
	ErrorCode,
	apiResponseSchema,
	errorResponseSchema,
} from "@prnews/common";
import type { Dependencies } from "../../config/di";
import {
	respondOpenApiError,
	respondOpenApiSuccess,
} from "../../utils/apiResponder";

const generalRoutes = new OpenAPIHono<{ Variables: Dependencies }>();

// レスポンスの "data" プロパティに入る部分のスキーマを定義
const healthzResponseDataSchema = z.object({
	ok: z.boolean().openapi({ description: "ヘルスチェック結果 (true=正常)" }),
});

// APIルートの定義
const healthzRoute = createRoute({
	method: "get",
	path: "/healthz",
	summary: "ヘルスチェック",
	description:
		"サービスの稼働状況を確認します。コンテナやロードバランサのliveness/readiness probeに使用されます。",
	tags: ["General"],
	responses: {
		200: {
			description: "サービス正常稼働",
			content: {
				"application/json": {
					schema: apiResponseSchema(healthzResponseDataSchema),
				},
			},
		},
		500: {
			description: "サーバー内部エラー",
			content: {
				"application/json": {
					schema: errorResponseSchema,
				},
			},
		},
	},
});

generalRoutes.openapi(healthzRoute, async (c) => {
	const { generalService } = c.var;
	try {
		const healthStatus = await generalService.checkHealth();
		return respondOpenApiSuccess(c, healthStatus, 200);
	} catch (error) {
		console.error("Health check failed:", error);
		return respondOpenApiError(
			c,
			{
				code: ErrorCode.INTERNAL_SERVER_ERROR,
				details: "Health check failed",
			},
			500,
		);
	}
});

export default generalRoutes;
