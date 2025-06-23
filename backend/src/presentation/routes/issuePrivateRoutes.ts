import { createRoute, z } from "@hono/zod-openapi";
import {
	issueArticleSchema,
	issueListItemSchema,
	successResponseSchema,
} from "@prnews/common";
import { HTTPException } from "hono/http-exception";
import { createApp } from "../hono-app";

const ingestIssueRoute = createRoute({
	method: "post",
	path: "/repos/{owner}/{repo}/issues/{number}/ingest",
	summary: "IssueをDBに取り込む",
	description: "指定されたIssueの情報をGitHubから取得し、DBに保存します。",
	tags: ["Issue"],

	security: [{ bearerAuth: [] }],
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
					description: "Issueの番号",
					example: "80528",
				}),
		}),
	},
	responses: {
		200: {
			description: "保存に成功",
			content: {
				"application/json": {
					schema: successResponseSchema(issueArticleSchema),
				},
			},
		},
		401: { description: "認証エラー" },
		403: { description: "権限エラー（例: GitHubトークン未登録）" },
		404: { description: "指定されたIssueが見つからない" },
		500: { description: "サーバー内部エラー" },
	},
});

const generateIssueArticleRoute = createRoute({
	method: "post",
	path: "/repos/{owner}/{repo}/issues/{number}/article",
	summary: "Issueの解説記事を生成",
	description: "DB上のIssueデータをAIで要約し、記事として完成させます。",
	tags: ["Issue"],

	security: [{ bearerAuth: [] }],
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
					description: "Issueの番号",
					example: "80528",
				}),
		}),
	},
	responses: {
		200: {
			description: "記事生成に成功",
			content: {
				"application/json": {
					schema: successResponseSchema(issueArticleSchema),
				},
			},
		},
		401: { description: "認証エラー" },
		403: { description: "権限エラー" },
		404: { description: "データが見つからない" },
		500: { description: "サーバー内部エラー" },
	},
});

const listRepoIssuesRoute = createRoute({
	method: "get",
	path: "/repos/{owner}/{repo}/issues",
	summary: "リポジトリのIssue一覧を取得",
	description:
		"指定されたリポジトリのIssue一覧を、解説記事の有無と合わせて取得します。",
	tags: ["Issue"],

	security: [{ bearerAuth: [] }],
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
		}),
		query: z.object({
			state: z.enum(["open", "closed", "all"]).optional(),
			per_page: z
				.string()
				.optional()
				.transform(Number)
				.openapi({
					param: { name: "per_page", in: "query" },
					description: "1ページあたりのIssue数",
					example: "10",
				}),
			page: z
				.string()
				.optional()
				.transform(Number)
				.openapi({
					param: { name: "page", in: "query" },
					description: "ページ番号(0インデックス)",
					example: "0",
				}),
		}),
	},
	responses: {
		200: {
			description: "Issue一覧の取得成功",
			content: {
				"application/json": {
					schema: successResponseSchema(z.array(issueListItemSchema)),
				},
			},
		},
		401: { description: "認証エラー" },
		403: { description: "権限エラー（GitHubトークン未登録など）" },
		404: { description: "リポジトリが見つからない" },
	},
});

const issuePrivateRoutes = createApp()
	// 保護POST/GET
	.openapi(ingestIssueRoute, async (c) => {
		const { issueService } = c.var;
		const user = c.var.user;
		if (!user) throw new HTTPException(401, { message: "Unauthenticated" });
		const { owner, repo, number } = c.req.valid("param");
		const article = await issueService.ingestIssue(
			user.id,
			owner,
			repo,
			number,
		);
		return c.json({ success: true, data: article }, 200);
	})
	.openapi(generateIssueArticleRoute, async (c) => {
		const { issueService } = c.var;
		const user = c.var.user;
		if (!user) throw new HTTPException(401, { message: "Unauthenticated" });
		const { owner, repo, number } = c.req.valid("param");
		const article = await issueService.generateIssueArticle(
			owner,
			repo,
			number,
		);
		return c.json({ success: true, data: article }, 200);
	})
	.openapi(listRepoIssuesRoute, async (c) => {
		const { issueService } = c.var;
		const user = c.var.user;
		if (!user) throw new HTTPException(401, { message: "Unauthenticated" });
		const { owner, repo } = c.req.valid("param");
		const query = c.req.valid("query");
		const issueList = await issueService.getIssueListForRepo(
			user.id,
			owner,
			repo,
			query,
		);
		return c.json({ success: true, data: issueList });
	});

export type IssuePrivateRoutesType = typeof issuePrivateRoutes;

export default issuePrivateRoutes;
