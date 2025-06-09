import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import {
	errorResponseSchema,
	pullRequestArticleSchema,
	pullRequestListItemSchema,
	pullRequestSchema,
	successResponseSchema,
} from "@prnews/common";
import { HTTPException } from "hono/http-exception";
import type { Dependencies } from "../../config/di";
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
				"application/json": {
					schema: successResponseSchema(pullRequestSchema),
				},
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
	await authMiddleware(c, async () => {});
	const { prService } = c.var;
	const params = c.req.valid("param");
	const authenticatedUser = c.var.user;
	if (!authenticatedUser) {
		throw new HTTPException(401, { message: "Unauthenticated" });
	}
	const ingestedPr = await prService.ingestPr(
		authenticatedUser.id,
		params.owner,
		params.repo,
		params.number,
	);
	return c.json({ success: true as const, data: ingestedPr }, 200);
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
					schema: successResponseSchema(pullRequestArticleSchema),
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
	await authMiddleware(c, async () => {});
	const { prService } = c.var;
	const params = c.req.valid("param");
	const articleRaw = await prService.generateArticle(
		params.owner,
		params.repo,
		params.number,
	);
	const article = pullRequestArticleSchema.parse(articleRaw);
	return c.json({ success: true as const, data: article }, 200);
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
				"application/json": {
					schema: successResponseSchema(pullRequestSchema),
				},
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
	await authMiddleware(c, async () => {});
	const { prService } = c.var;
	const params = c.req.valid("param");
	const pr = await prService.getPullRequest(
		params.owner,
		params.repo,
		params.number,
	);
	if (!pr) {
		throw new HTTPException(404, {
			message: "Pull request not found in cache",
		});
	}
	return c.json({ success: true as const, data: pr }, 200);
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
					schema: successResponseSchema(pullRequestArticleSchema),
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
	const pullRequest = await prRepo.findByOwnerRepoNumber(
		params.owner,
		params.repo,
		params.number,
	);
	if (!pullRequest) {
		throw new HTTPException(404, {
			message: "Original pull request not found",
		});
	}
	const prId = pullRequest.id;
	const article = await prService.getArticle(prId);
	if (!article) {
		throw new HTTPException(404, {
			message: "Article not found for this pull request",
		});
	}
	return c.json({ success: true as const, data: article }, 200);
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
					schema: successResponseSchema(z.array(pullRequestListItemSchema)),
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
	await authMiddleware(c, async () => {});
	const { prService } = c.var;
	const authenticatedUser = c.var.user;
	if (!authenticatedUser) {
		throw new HTTPException(401, { message: "Unauthenticated" });
	}
	const { owner, repo } = c.req.valid("param");
	const query = c.req.valid("query");
	const prList = await prService.getPullRequestListForRepo(
		authenticatedUser.id,
		owner,
		repo,
		query,
	);
	return c.json({ success: true as const, data: prList }, 200);
});

export default prRoutes;
