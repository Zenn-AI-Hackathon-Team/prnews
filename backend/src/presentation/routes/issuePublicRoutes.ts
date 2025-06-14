import { createRoute, z } from "@hono/zod-openapi";
import { issueArticleSchema, successResponseSchema } from "@prnews/common";
import { HTTPException } from "hono/http-exception";
import { createApp } from "../hono-app";

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

const issuePublicRoutes = createApp().openapi(
	getIssueArticleRoute,
	async (c) => {
		const { issueService } = c.var;
		const { owner, repo, number } = c.req.valid("param");
		const article = await issueService.getArticle(owner, repo, number);
		if (!article) {
			throw new HTTPException(404, {
				message: "記事が見つからない、または未生成",
			});
		}
		return c.json({ success: true, data: article }, 200);
	},
);

export type IssuePublicRoutesType = typeof issuePublicRoutes;
export default issuePublicRoutes;
