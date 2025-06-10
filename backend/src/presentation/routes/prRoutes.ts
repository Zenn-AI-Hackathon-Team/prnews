import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { RouteConfigToTypedResponse } from "@hono/zod-openapi";
import {
	ErrorCode,
	apiResponseSchema,
	errorResponseSchema,
	pullRequestArticleSchema,
	pullRequestListItemSchema,
	pullRequestSchema,
} from "@prnews/common";
import { errorStatusMap } from "@prnews/common";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { Dependencies } from "../../config/di";
import { AppError } from "../../errors/AppError";
import { NotFoundError } from "../../errors/NotFoundError";
import {
	respondOpenApiError,
	respondOpenApiSuccess,
} from "../../utils/apiResponder";
import type { AuthVariables } from "../middlewares/authMiddleware";
import { authMiddleware } from "../middlewares/authMiddleware";

const prRoutes = new OpenAPIHono<{ Variables: Dependencies & AuthVariables }>();

// --- POST /repos/{owner}/{repo}/pulls/{number}/ingest ---
const ingestPrRoute = createRoute({
	method: "post",
	path: "/repos/{owner}/{repo}/pulls/{number}/ingest",
	summary: "GitHubから指定されたPull Request情報を取得・保存",
	security: [{ bearerAuth: [] }],
	tags: ["Pull Request"],
	request: {
		params: z.object({
			owner: z.string().openapi({ example: "openai" }),
			repo: z.string().openapi({ example: "gpt-4" }),
			number: z
				.string()
				.regex(/^\d+$/)
				.transform(Number)
				.openapi({ example: "1" }),
		}),
	},
	responses: {
		200: {
			description: "Pull Request情報の取得・保存成功",
			content: {
				"application/json": { schema: apiResponseSchema(pullRequestSchema) },
			},
		},
		401: {
			description: "認証エラー",
			content: { "application/json": { schema: errorResponseSchema } },
		},
		404: {
			description: "PRが見つからない",
			content: { "application/json": { schema: errorResponseSchema } },
		},
	},
});
prRoutes.openapi(ingestPrRoute, async (c) => {
	const authResult = await authMiddleware(c, async () => {});
	if (authResult)
		return authResult as unknown as RouteConfigToTypedResponse<
			typeof ingestPrRoute
		>;
	const { prService } = c.var;
	const params = c.req.valid("param");
	const authenticatedUser = c.var.user;
	if (!authenticatedUser) {
		return respondOpenApiError(
			c,
			{ code: ErrorCode.UNAUTHENTICATED },
			200,
		) as unknown as RouteConfigToTypedResponse<typeof ingestPrRoute>;
	}
	try {
		const ingestedPr = await prService.ingestPr(
			authenticatedUser.id,
			params.owner,
			params.repo,
			params.number,
		);
		return respondOpenApiSuccess(
			c,
			ingestedPr,
			200,
		) as unknown as RouteConfigToTypedResponse<typeof ingestPrRoute>;
	} catch (error) {
		if (error instanceof NotFoundError) {
			return respondOpenApiError(
				c,
				{ code: ErrorCode.NOT_FOUND, message: error.message },
				200,
			) as unknown as RouteConfigToTypedResponse<typeof ingestPrRoute>;
		}
		return respondOpenApiError(
			c,
			{
				code: ErrorCode.INTERNAL_SERVER_ERROR,
				message: "Failed to ingest pull request",
			},
			200,
		) as unknown as RouteConfigToTypedResponse<typeof ingestPrRoute>;
	}
});

// --- POST /repos/{owner}/{repo}/pulls/{number}/article ---
const generateArticleRoute = createRoute({
	method: "post",
	path: "/repos/{owner}/{repo}/pulls/{number}/article",
	summary: "Pull Request記事の生成",
	security: [{ bearerAuth: [] }],
	tags: ["Pull Request"],
	request: {
		params: z.object({
			owner: z.string(),
			repo: z.string(),
			number: z.string().regex(/^\d+$/).transform(Number),
		}),
	},
	responses: {
		200: {
			description: "記事生成成功",
			content: {
				"application/json": {
					schema: apiResponseSchema(pullRequestArticleSchema),
				},
			},
		},
		404: {
			description: "PRまたは記事が見つからない",
			content: { "application/json": { schema: errorResponseSchema } },
		},
		500: {
			description: "サーバーエラー",
			content: { "application/json": { schema: errorResponseSchema } },
		},
	},
});
prRoutes.openapi(generateArticleRoute, async (c) => {
	const authResult = await authMiddleware(c, async () => {});
	if (authResult)
		return authResult as unknown as RouteConfigToTypedResponse<
			typeof generateArticleRoute
		>;
	const { prService } = c.var;
	const params = c.req.valid("param");
	try {
		const articleRaw = await prService.generateArticle(
			params.owner,
			params.repo,
			params.number,
		);
		const article = pullRequestArticleSchema.parse(articleRaw);
		return respondOpenApiSuccess(
			c,
			article,
			200,
		) as unknown as RouteConfigToTypedResponse<typeof generateArticleRoute>;
	} catch (error) {
		if (error instanceof NotFoundError) {
			return respondOpenApiError(
				c,
				{ code: ErrorCode.NOT_FOUND, message: error.message },
				200,
			) as unknown as RouteConfigToTypedResponse<typeof generateArticleRoute>;
		}
		return respondOpenApiError(
			c,
			{
				code: ErrorCode.INTERNAL_SERVER_ERROR,
				message: "Failed to generate article",
			},
			200,
		) as unknown as RouteConfigToTypedResponse<typeof generateArticleRoute>;
	}
});

// --- GET /repos/{owner}/{repo}/pulls/{number} ---
const getPrRoute = createRoute({
	method: "get",
	path: "/repos/{owner}/{repo}/pulls/{number}",
	summary: "Pull Request情報の取得（キャッシュ）",
	security: [{ bearerAuth: [] }],
	tags: ["Pull Request"],
	request: {
		params: z.object({
			owner: z.string(),
			repo: z.string(),
			number: z.string().regex(/^\d+$/).transform(Number),
		}),
	},
	responses: {
		200: {
			description: "取得成功",
			content: {
				"application/json": { schema: apiResponseSchema(pullRequestSchema) },
			},
		},
		404: {
			description: "PRが見つからない",
			content: { "application/json": { schema: errorResponseSchema } },
		},
		500: {
			description: "サーバーエラー",
			content: { "application/json": { schema: errorResponseSchema } },
		},
	},
});
prRoutes.openapi(getPrRoute, async (c) => {
	const authResult = await authMiddleware(c, async () => {});
	if (authResult)
		return authResult as unknown as RouteConfigToTypedResponse<
			typeof getPrRoute
		>;
	const { prService } = c.var;
	const params = c.req.valid("param");
	try {
		const pr = await prService.getPullRequest(
			params.owner,
			params.repo,
			params.number,
		);
		if (!pr) {
			return respondOpenApiError(
				c,
				{
					code: ErrorCode.NOT_FOUND,
					message: "Pull request not found in cache",
				},
				200,
			) as unknown as RouteConfigToTypedResponse<typeof getPrRoute>;
		}
		return respondOpenApiSuccess(
			c,
			pr,
			200,
		) as unknown as RouteConfigToTypedResponse<typeof getPrRoute>;
	} catch (error) {
		return respondOpenApiError(
			c,
			{
				code: ErrorCode.INTERNAL_SERVER_ERROR,
				message: "Failed to get pull request",
			},
			200,
		) as unknown as RouteConfigToTypedResponse<typeof getPrRoute>;
	}
});

// --- GET /repos/{owner}/{repo}/pulls/{number}/article ---
const getArticleRoute = createRoute({
	method: "get",
	path: "/repos/{owner}/{repo}/pulls/{number}/article",
	summary: "Pull Request記事の取得",
	security: [{ bearerAuth: [] }],
	tags: ["Pull Request"],
	request: {
		params: z.object({
			owner: z.string(),
			repo: z.string(),
			number: z.string().regex(/^\d+$/).transform(Number),
		}),
	},
	responses: {
		200: {
			description: "取得成功",
			content: {
				"application/json": {
					schema: apiResponseSchema(pullRequestArticleSchema),
				},
			},
		},
		404: {
			description: "記事が見つからない",
			content: { "application/json": { schema: errorResponseSchema } },
		},
		500: {
			description: "サーバーエラー",
			content: { "application/json": { schema: errorResponseSchema } },
		},
	},
});
prRoutes.openapi(getArticleRoute, async (c) => {
	const { prService, prRepo } = c.var;
	const params = c.req.valid("param");
	try {
		const pullRequest = await prRepo.findByOwnerRepoNumber(
			params.owner,
			params.repo,
			params.number,
		);
		if (!pullRequest) {
			return respondOpenApiError(
				c,
				{
					code: ErrorCode.NOT_FOUND,
					message: "Original pull request not found",
				},
				200,
			);
		}
		const prId = pullRequest.id;
		const article = await prService.getArticle(prId);
		if (!article) {
			return respondOpenApiError(
				c,
				{
					code: ErrorCode.NOT_FOUND,
					message: "Article not found for this pull request",
				},
				200,
			);
		}
		return respondOpenApiSuccess(c, article, 200);
	} catch (error) {
		return respondOpenApiError(
			c,
			{
				code: ErrorCode.INTERNAL_SERVER_ERROR,
				message: "Failed to get article",
			},
			200,
		);
	}
});

// --- GET /repos/{owner}/{repo}/pulls ---
const listRepoPullsRoute = createRoute({
	method: "get",
	path: "/repos/{owner}/{repo}/pulls",
	summary: "リポジトリのプルリクエスト一覧を取得",
	description:
		"指定されたリポジトリのPR一覧を、解説記事の有無と合わせて取得します。",
	security: [{ bearerAuth: [] }],
	tags: ["Pull Request"],
	request: {
		params: z.object({
			owner: z.string().openapi({ example: "masa-massara" }),
			repo: z.string().openapi({ example: "NotiPal" }),
		}),
		query: z.object({
			state: z
				.enum(["open", "closed", "all"])
				.optional()
				.openapi({ description: "PRの状態" }),
			per_page: z
				.string()
				.optional()
				.transform(Number)
				.openapi({ description: "1ページあたりの件数" }),
			page: z
				.string()
				.optional()
				.transform(Number)
				.openapi({ description: "ページ番号" }),
		}),
	},
	responses: {
		200: {
			description: "PR一覧の取得成功",
			content: {
				"application/json": {
					schema: apiResponseSchema(z.array(pullRequestListItemSchema)),
				},
			},
		},
		404: {
			description: "リポジトリが見つからない等",
			content: { "application/json": { schema: errorResponseSchema } },
		},
		500: {
			description: "サーバーエラー",
			content: { "application/json": { schema: errorResponseSchema } },
		},
	},
});
prRoutes.openapi(listRepoPullsRoute, async (c) => {
	const authResult = await authMiddleware(c, async () => {});
	if (authResult)
		return authResult as unknown as RouteConfigToTypedResponse<
			typeof listRepoPullsRoute
		>;
	const { prService } = c.var;
	const authenticatedUser = c.var.user;
	if (!authenticatedUser) {
		return respondOpenApiError(
			c,
			{ code: ErrorCode.UNAUTHENTICATED },
			200,
		) as unknown as RouteConfigToTypedResponse<typeof listRepoPullsRoute>;
	}
	const { owner, repo } = c.req.valid("param");
	const query = c.req.valid("query");
	try {
		const prList = await prService.getPullRequestListForRepo(
			authenticatedUser.id,
			owner,
			repo,
			query,
		);
		return respondOpenApiSuccess(
			c,
			prList,
			200,
		) as unknown as RouteConfigToTypedResponse<typeof listRepoPullsRoute>;
	} catch (error) {
		console.error(
			"====== /pulls ルートハンドラでエラーをキャッチしました ======",
		);
		console.error(error);
		console.error("======================================================");
		if (error instanceof AppError) {
			const status = errorStatusMap[error.code] ?? 200;
			return respondOpenApiError(
				c,
				{ code: error.code, message: error.message },
				status as ContentfulStatusCode,
			) as unknown as RouteConfigToTypedResponse<typeof listRepoPullsRoute>;
		}
		return respondOpenApiError(
			c,
			{
				code: ErrorCode.INTERNAL_SERVER_ERROR,
				message: "Failed to get pull request list",
			},
			200,
		) as unknown as RouteConfigToTypedResponse<typeof listRepoPullsRoute>;
	}
});

export default prRoutes;
