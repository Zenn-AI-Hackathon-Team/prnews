import { createRoute, z } from "@hono/zod-openapi";
import { issueArticleSchema, successResponseSchema } from "@prnews/common";
import { HTTPException } from "hono/http-exception";
import { createApp } from "../hono-app";
import { authMiddleware } from "../middlewares/authMiddleware";

const ingestIssueRoute = createRoute({
	method: "post",
	path: "/repos/{owner}/{repo}/issues/{number}/ingest",
	summary: "IssueをDBに取り込む",
	description: "指定されたIssueの情報をGitHubから取得し、DBに保存します。",
	tags: ["Issue"],
	security: [{ bearerAuth: [] }],
	request: {
		params: z.object({
			owner: z.string(),
			repo: z.string(),
			number: z.string().regex(/^\d+$/).transform(Number),
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
			owner: z.string(),
			repo: z.string(),
			number: z.string().regex(/^\d+$/).transform(Number),
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

const getIssueArticleRoute = createRoute({
	method: "get",
	path: "/repos/{owner}/{repo}/issues/{number}/article",
	summary: "Issueの解説記事を取得",
	description: "生成済みのIssue解説記事を取得します。",
	tags: ["Issue"],
	request: {
		params: z.object({
			owner: z.string(),
			repo: z.string(),
			number: z.string().regex(/^\d+$/).transform(Number),
		}),
	},
	responses: {
		200: {
			description: "記事の取得に成功",
			content: {
				"application/json": {
					schema: successResponseSchema(issueArticleSchema),
				},
			},
		},
		404: { description: "記事が見つからない、または未生成" },
	},
});

// 認証不要な公開ルート
const publicRoutes = createApp().openapi(getIssueArticleRoute, async (c) => {
	const { issueService } = c.var;
	const { owner, repo, number } = c.req.valid("param");

	const article = await issueService.getArticle(owner, repo, number);

	return c.json({ success: true, data: article }, 200);
});

// 認証必須な保護ルート
const privateRoutes = createApp()
	.openapi(ingestIssueRoute, async (c) => {
		const { issueService } = c.var;
		const user = c.var.user;
		if (!user) {
			throw new HTTPException(401, { message: "User not authenticated" });
		}
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
		if (!user) {
			throw new HTTPException(401, { message: "User not authenticated" });
		}
		const { owner, repo, number } = c.req.valid("param");

		const article = await issueService.generateIssueArticle(
			owner,
			repo,
			number,
		);

		return c.json({ success: true, data: article }, 200);
	});

const issueRoutes = createApp()
	.route("/", publicRoutes)
	.use("/repos/{owner}/{repo}/issues/{number}/ingest", authMiddleware)
	.use("/repos/{owner}/{repo}/issues/{number}/article", authMiddleware)
	.route("/", privateRoutes);

export default issueRoutes;
