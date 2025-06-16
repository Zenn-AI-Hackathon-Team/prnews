import { createRoute, z } from "@hono/zod-openapi";
import {
	errorResponseSchema,
	pullRequestArticleSchema,
	pullRequestSchema,
	successResponseSchema,
} from "@prnews/common";
import { HTTPException } from "hono/http-exception";
import { createApp } from "../hono-app";

const getPrRoute = createRoute({
	method: "get",
	path: "/repos/{owner}/{repo}/pulls/{number}",
	summary: "Pull Request情報の取得（キャッシュ）",
	description: `\
指定されたリポジトリ・PR番号のPull Request情報をキャッシュから取得します。
- DBにキャッシュがない場合は404。
`,
	tags: ["Pull Request"],
	request: {
		params: z.object({
			owner: z.string().openapi({
				param: { name: "owner", in: "path" },
				description: "リポジトリのオーナー名",
				example: "vercel",
			}),
			repo: z.string().openapi({
				param: { name: "repo", in: "path" },
				description: "リポジトリ名",
				example: "next.js",
			}),
			number: z
				.string()
				.regex(/^\d+$/)
				.transform(Number)
				.openapi({
					param: { name: "number", in: "path" },
					description: "Pull Requestの番号",
					example: "42",
				}),
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
			description: "指定されたPRがキャッシュに存在しない場合。",
			content: {
				"application/json": {
					schema: errorResponseSchema,
				},
			},
		},
		500: {
			description: "サーバーエラー。DB障害など。",
			content: {
				"application/json": {
					schema: errorResponseSchema,
				},
			},
		},
		422: {
			description:
				"パラメータバリデーションエラー（owner/repo/number不正など）",
			content: {
				"application/json": {
					schema: errorResponseSchema,
				},
			},
		},
	},
});
const getArticleRoute = createRoute({
	method: "get",
	path: "/repos/{owner}/{repo}/pulls/{number}/article",
	summary: "Pull Request記事の取得",
	description: `\
指定されたリポジトリ・PR番号のPull Request記事を取得します。
- PRが存在しない場合や記事が未生成の場合は404。
`,
	tags: ["Pull Request"],
	request: {
		params: z.object({
			owner: z.string().openapi({
				param: { name: "owner", in: "path" },
				description: "リポジトリのオーナー名",
				example: "vercel",
			}),
			repo: z.string().openapi({
				param: { name: "repo", in: "path" },
				description: "リポジトリ名",
				example: "next.js",
			}),
			number: z
				.string()
				.regex(/^\d+$/)
				.transform(Number)
				.openapi({
					param: { name: "number", in: "path" },
					description: "Pull Requestの番号",
					example: "42",
				}),
		}),
	},
	responses: {
		200: {
			description: "記事取得成功",
			content: {
				"application/json": {
					schema: successResponseSchema(pullRequestArticleSchema),
				},
			},
		},
		404: {
			description: "指定されたPRまたは記事が存在しない場合。",
			content: {
				"application/json": {
					schema: errorResponseSchema,
				},
			},
		},
		500: {
			description: "サーバーエラー。DB障害など。",
			content: {
				"application/json": {
					schema: errorResponseSchema,
				},
			},
		},
		422: {
			description:
				"パラメータバリデーションエラー（owner/repo/number不正など）",
			content: {
				"application/json": {
					schema: errorResponseSchema,
				},
			},
		},
	},
});

const prPublicRoutes = createApp()
	.openapi(getPrRoute, async (c) => {
		const { prService } = c.var;
		const params = c.req.valid("param");
		const pr = await prService.getPullRequest(
			params.owner,
			params.repo,
			params.number,
		);
		if (!pr)
			throw new HTTPException(404, {
				message: "Pull request not found in cache",
			});
		const parsed = pullRequestSchema.parse(pr);
		return c.json({ success: true as const, data: parsed }, 200);
	})
	.openapi(getArticleRoute, async (c) => {
		const { prService, prRepo } = c.var;
		const params = c.req.valid("param");
		const pullRequest = await prRepo.findByOwnerRepoNumber(
			params.owner,
			params.repo,
			params.number,
		);
		if (!pullRequest)
			throw new HTTPException(404, {
				message: "Original pull request not found",
			});
		const prId = pullRequest.id;
		const article = await prService.getArticle(prId);
		if (!article)
			throw new HTTPException(404, {
				message: "Article not found for this pull request",
			});
		const parsed = pullRequestArticleSchema.parse(article);
		return c.json({ success: true as const, data: parsed }, 200);
	});

export type PrPublicRoutesType = typeof prPublicRoutes;
export default prPublicRoutes;
