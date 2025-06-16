import { createRoute, z } from "@hono/zod-openapi";
import {
	errorResponseSchema,
	pullRequestArticleSchema,
	pullRequestListItemSchema,
	pullRequestSchema,
	successResponseSchema,
} from "@prnews/common";
import { HTTPException } from "hono/http-exception";
import { createApp } from "../hono-app";

// =============================
// 各ルートのスキーマ定義（既存定義をそのまま利用）
// =============================
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
					example: {
						code: "HTTP_EXCEPTION",
						message: "Pull request not found in cache",
					},
				},
			},
		},
		500: {
			description: "サーバーエラー。DB障害など。",
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
		422: {
			description:
				"パラメータバリデーションエラー（owner/repo/number不正など）",
			content: {
				"application/json": {
					schema: errorResponseSchema,
					example: {
						code: "VALIDATION_ERROR",
						message: "Validation Failed",
						details: [
							{
								code: "invalid_string",
								type: "string",
								path: ["owner"],
								message: "owner is required",
							},
						],
					},
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
					example: {
						code: "HTTP_EXCEPTION",
						message: "Article not found for this pull request",
					},
				},
			},
		},
		500: {
			description: "サーバーエラー。DB障害など。",
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
		422: {
			description:
				"パラメータバリデーションエラー（owner/repo/number不正など）",
			content: {
				"application/json": {
					schema: errorResponseSchema,
					example: {
						code: "VALIDATION_ERROR",
						message: "Validation Failed",
						details: [
							{
								code: "invalid_string",
								type: "string",
								path: ["owner"],
								message: "owner is required",
							},
						],
					},
				},
			},
		},
	},
});
const ingestPrRoute = createRoute({
	method: "post",
	path: "/repos/{owner}/{repo}/pulls/{number}/ingest",
	summary: "GitHubからPull Request情報を取得・保存",
	description: `\
指定されたリポジトリのPull Request情報をGitHub APIから取得し、データベースに保存（取り込み）します。この処理はGitHub APIを消費します。
- 既に同じPRが存在する場合は上書き保存されます。
- 本APIは認証（Bearerトークン）が必須です。
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
			description: "Pull Request情報の取得・保存成功",
			content: {
				"application/json": {
					schema: successResponseSchema(pullRequestSchema),
				},
			},
		},
		401: {
			description: "認証エラー。Bearerトークンが無効または未指定。",
			content: {
				"application/json": {
					schema: errorResponseSchema,
					example: { code: "HTTP_EXCEPTION", message: "Unauthenticated" },
				},
			},
		},
		404: {
			description: "指定されたPRがGitHub上に存在しない場合。",
			content: {
				"application/json": {
					schema: errorResponseSchema,
					example: { code: "HTTP_EXCEPTION", message: "PRが見つかりません" },
				},
			},
		},
		422: {
			description:
				"パラメータバリデーションエラー（owner/repo/number不正など）",
			content: {
				"application/json": {
					schema: errorResponseSchema,
					example: {
						code: "VALIDATION_ERROR",
						message: "Validation Failed",
						details: [
							{
								code: "invalid_string",
								type: "string",
								path: ["owner"],
								message: "owner is required",
							},
						],
					},
				},
			},
		},
	},
	security: [{ bearerAuth: [] }],
});
const generateArticleRoute = createRoute({
	method: "post",
	path: "/repos/{owner}/{repo}/pulls/{number}/article",
	summary: "Pull Request記事のAI自動生成",
	description: `\
指定されたリポジトリ・PR番号のPull Request記事をAIで自動生成します。
- 既に記事が存在する場合は上書き生成されます。
- 本APIは認証（Bearerトークン）が必須です。
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
			description: "記事生成成功",
			content: {
				"application/json": {
					schema: successResponseSchema(pullRequestArticleSchema),
				},
			},
		},
		404: {
			description: "PRまたは記事が見つからない場合。",
			content: {
				"application/json": {
					schema: errorResponseSchema,
					example: {
						code: "HTTP_EXCEPTION",
						message: "PRまたは記事が見つかりません",
					},
				},
			},
		},
		500: {
			description: "サーバーエラー。AI生成処理失敗など。",
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
		422: {
			description:
				"パラメータバリデーションエラー（owner/repo/number不正など）",
			content: {
				"application/json": {
					schema: errorResponseSchema,
					example: {
						code: "VALIDATION_ERROR",
						message: "Validation Failed",
						details: [
							{
								code: "invalid_string",
								type: "string",
								path: ["owner"],
								message: "owner is required",
							},
						],
					},
				},
			},
		},
	},
	security: [{ bearerAuth: [] }],
});
const listRepoPullsRoute = createRoute({
	method: "get",
	path: "/repos/{owner}/{repo}/pulls",
	summary: "リポジトリのプルリクエスト一覧を取得",
	description: `\
指定されたリポジトリのPR一覧を、解説記事の有無と合わせて取得します。
- PRの状態（open/closed/all）やページネーションも指定可能。
- 本APIは認証（Bearerトークン）が必須です。
`,
	tags: ["Pull Request"],

	request: {
		params: z.object({
			owner: z.string().openapi({
				param: { name: "owner", in: "path" },
				description: "リポジトリのオーナー名",
				example: "masa-massara",
			}),
			repo: z.string().openapi({
				param: { name: "repo", in: "path" },
				description: "リポジトリ名",
				example: "NotiPal",
			}),
		}),
		query: z.object({
			state: z.enum(["open", "closed", "all"]).optional().openapi({
				description: "PRの状態（open/closed/all）",
				example: "open",
			}),
			per_page: z.string().optional().transform(Number).openapi({
				description: "1ページあたりの件数",
				example: "20",
			}),
			page: z.string().optional().transform(Number).openapi({
				description: "ページ番号",
				example: "1",
			}),
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
			description: "指定されたリポジトリが存在しない場合。",
			content: {
				"application/json": {
					schema: errorResponseSchema,
					example: { code: "HTTP_EXCEPTION", message: "Repository not found" },
				},
			},
		},
		500: {
			description: "サーバーエラー。DB障害など。",
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
		422: {
			description: "パラメータバリデーションエラー（owner/repo不正など）",
			content: {
				"application/json": {
					schema: errorResponseSchema,
					example: {
						code: "VALIDATION_ERROR",
						message: "Validation Failed",
						details: [
							{
								code: "invalid_string",
								type: "string",
								path: ["owner"],
								message: "owner is required",
							},
						],
					},
				},
			},
		},
	},
	security: [{ bearerAuth: [] }],
});
const likeResponseSchema = z.object({
	likeCount: z.number().int().nonnegative(),
	message: z.string(),
});
const likeArticleRoute = createRoute({
	method: "post",
	path: "/articles/{articleId}/language/{langCode}/like",
	summary: "AI解説記事の特定言語版に「いいね」を付与",
	description: `\
指定されたAI解説記事（Pull Request記事）の特定言語版（例: 日本語 "ja"）に「いいね」を付けます。
- すでに同じユーザーが同じ記事・言語にいいね済みの場合はlikeCountのみ返します（副作用なし）。
- 記事または言語版が存在しない場合は404エラー。
- 本APIは認証（Bearerトークン）が必須です。
`,
	tags: ["Likes"],

	request: {
		params: z.object({
			articleId: z
				.string()
				.min(1)
				.openapi({
					param: { name: "articleId", in: "path" },
					description: "対象AI解説記事のID（UUID形式推奨）",
					example: "11111111-1111-1111-1111-111111111111",
				}),
			langCode: z
				.string()
				.length(2)
				.openapi({
					param: { name: "langCode", in: "path" },
					description: "言語コード（2文字、例: 'ja', 'en'）",
					example: "ja",
				}),
		}),
	},
	responses: {
		201: {
			description: "新規でいいねした場合。likeCountは1増加。",
			content: {
				"application/json": {
					schema: successResponseSchema(likeResponseSchema),
					example: {
						success: true,
						data: { likeCount: 5, message: "いいねしました" },
					},
				},
			},
		},
		200: {
			description: "既にいいね済みの場合。likeCountは変化しない。",
			content: {
				"application/json": {
					schema: successResponseSchema(likeResponseSchema),
					example: {
						success: true,
						data: { likeCount: 5, message: "既にいいね済みです" },
					},
				},
			},
		},
		401: {
			description: "認証エラー。Bearerトークンが無効または未指定。",
			content: {
				"application/json": {
					schema: errorResponseSchema,
					example: { code: "HTTP_EXCEPTION", message: "Unauthenticated" },
				},
			},
		},
		404: {
			description: "指定された記事または言語版が存在しない場合。",
			content: {
				"application/json": {
					schema: errorResponseSchema,
					example: {
						code: "HTTP_EXCEPTION",
						message: "指定された記事または言語版が見つかりません。",
					},
				},
			},
		},
		422: {
			description:
				"パラメータバリデーションエラー（articleId/言語コード不正など）",
			content: {
				"application/json": {
					schema: errorResponseSchema,
					example: {
						code: "VALIDATION_ERROR",
						message: "Validation Failed",
						details: [
							{
								code: "too_small",
								minimum: 1,
								type: "string",
								path: ["articleId"],
								message: "String must contain at least 1 character(s)",
							},
						],
					},
				},
			},
		},
	},
	security: [{ bearerAuth: [] }],
});

const prPrivateRoutes = createApp()
	.openapi(ingestPrRoute, async (c) => {
		const { prService } = c.var;
		const user = c.var.user;
		if (!user) throw new HTTPException(401, { message: "Unauthenticated" });
		const params = c.req.valid("param");
		const ingestedPr = await prService.ingestPr(
			user.id,
			params.owner,
			params.repo,
			params.number,
		);
		const parsed = pullRequestSchema.parse(ingestedPr);
		return c.json({ success: true as const, data: parsed }, 200);
	})
	.openapi(listRepoPullsRoute, async (c) => {
		const { prService } = c.var;
		const user = c.var.user;
		if (!user) throw new HTTPException(401, { message: "Unauthenticated" });
		const { owner, repo } = c.req.valid("param");
		const query = c.req.valid("query");
		const prList = await prService.getPullRequestListForRepo(
			user.id,
			owner,
			repo,
			query,
		);
		const parsed = pullRequestListItemSchema.array().parse(prList);
		return c.json({ success: true as const, data: parsed }, 200);
	})
	.openapi(likeArticleRoute, async (c) => {
		const { prService } = c.var;
		const user = c.var.user;
		if (!user) throw new HTTPException(401, { message: "Unauthenticated" });
		const { articleId, langCode } = c.req.valid("param");
		const result = await prService.likeArticle(user.id, articleId, langCode);
		const responseData = likeResponseSchema.parse({
			likeCount: result.likeCount,
			message: result.message,
		});
		if (result.alreadyLiked)
			return c.json({ success: true as const, data: responseData }, 200);
		return c.json({ success: true as const, data: responseData }, 201);
	})
	.openapi(generateArticleRoute, async (c) => {
		const { prService } = c.var;
		const user = c.var.user;
		if (!user) throw new HTTPException(401, { message: "Unauthenticated" });
		const params = c.req.valid("param");
		const article = await prService.generateArticle(
			params.owner,
			params.repo,
			params.number,
		);
		const parsed = pullRequestArticleSchema.parse(article);
		return c.json({ success: true as const, data: parsed }, 200);
	});

export type PrPrivateRoutesType = typeof prPrivateRoutes;

export default prPrivateRoutes;
