import { createRoute, z } from "@hono/zod-openapi";
import {
	errorResponseSchema,
	favoriteRepositorySchema,
	likedArticleInfoSchema,
	successResponseSchema,
	userSchema,
} from "@prnews/common";
import { deleteCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import { createApp } from "../hono-app";

// --- GET /users/me ---
const getMyProfileRoute = createRoute({
	method: "get",
	path: "/users/me",
	summary: "現在のユーザー情報を取得",
	description: `\
認証済みユーザーのプロフィール情報を返します。
- 本APIは認証（Bearerトークン）が必須です。
`,
	security: [{ bearerAuth: [] }],
	tags: ["User & Auth"],
	responses: {
		200: {
			description: "ユーザー情報の取得成功",
			content: {
				"application/json": {
					schema: successResponseSchema(userSchema),
				},
			},
		},
		401: {
			description: "認証エラー。Bearerトークンが無効または未指定。",
			content: {
				"application/json": {
					schema: errorResponseSchema,
				},
			},
		},
		404: {
			description: "ユーザーが存在しない場合。",
			content: {
				"application/json": {
					schema: errorResponseSchema,
				},
			},
		},
	},
});

const logoutRoute = createRoute({
	method: "post",
	path: "/auth/logout",
	summary: "ログアウト",
	description: `\
現在のユーザーのセッションを無効化します。
- 本APIは認証（Bearerトークン）が必須です。
`,
	security: [{ bearerAuth: [] }],
	tags: ["User & Auth"],
	responses: {
		200: {
			description: "ログアウト成功",
			content: {
				"application/json": {
					schema: successResponseSchema(z.object({})),
				},
			},
		},
		401: {
			description: "認証エラー。Bearerトークンが無効または未指定。",
			content: {
				"application/json": {
					schema: errorResponseSchema,
				},
			},
		},
		500: {
			description: "サーバーエラー。セッション無効化失敗など。",
			content: {
				"application/json": {
					schema: errorResponseSchema,
				},
			},
		},
	},
});

const signupRoute = createRoute({
	method: "post",
	path: "/auth/signup",
	summary: "ユーザー登録（サインアップ）",
	description: `\
認証済みユーザーの初回登録を行います。既に登録済みの場合は409。
- 本APIは認証（Bearerトークン）が必須です。
`,
	security: [{ bearerAuth: [] }],

	tags: ["User & Auth"],
	request: {
		body: {
			content: {
				"application/json": {
					schema: z.object({
						language: z.string().length(2).optional().openapi({
							description: "ユーザーの言語コード（2文字、例: 'ja'）",
							example: "ja",
						}),
					}),
				},
			},
		},
	},
	responses: {
		201: {
			description: "ユーザー作成成功",
			content: {
				"application/json": {
					schema: successResponseSchema(userSchema),
				},
			},
		},
		409: {
			description: "既にユーザーが存在する場合。",
			content: {
				"application/json": {
					schema: errorResponseSchema,
				},
			},
		},
		401: {
			description: "認証エラー。Bearerトークンが無効または未指定。",
			content: {
				"application/json": {
					schema: errorResponseSchema,
				},
			},
		},
		500: {
			description: "サーバーエラー。ユーザー作成失敗など。",
			content: {
				"application/json": {
					schema: errorResponseSchema,
				},
			},
		},
	},
});

const sessionRoute = createRoute({
	method: "post",
	path: "/auth/session",
	summary: "セッション作成",
	description: `\
認証済みユーザーのセッションを新規作成します。
- 本APIは認証（Bearerトークン）が必須です。
`,
	security: [{ bearerAuth: [] }],
	tags: ["User & Auth"],
	responses: {
		201: {
			description: "セッション作成成功",
			content: {
				"application/json": {
					schema: successResponseSchema(z.any()),
				},
			},
		},
		401: {
			description: "認証エラー。Bearerトークンが無効または未指定。",
			content: {
				"application/json": {
					schema: errorResponseSchema,
				},
			},
		},
		500: {
			description: "サーバーエラー。セッション作成失敗など。",
			content: {
				"application/json": {
					schema: errorResponseSchema,
				},
			},
		},
	},
});

const addFavoriteRepoRoute = createRoute({
	method: "post",
	path: "/users/me/favorite-repositories",
	summary: "お気に入りリポジトリを登録",
	description: `\
ユーザーのお気に入りリポジトリを追加します。
- 既に登録済みなら200、新規なら201。
- 本APIは認証（Bearerトークン）が必須です。
`,
	security: [{ bearerAuth: [] }],
	tags: ["Favorites"],
	request: {
		body: {
			content: {
				"application/json": {
					schema: z.object({
						owner: z.string().openapi({
							description: "リポジトリのオーナー名",
							example: "vercel",
						}),
						repo: z.string().openapi({
							description: "リポジトリ名",
							example: "next.js",
						}),
					}),
				},
			},
		},
	},
	responses: {
		200: {
			description: "既にお気に入り登録済み",
			content: {
				"application/json": {
					schema: successResponseSchema(favoriteRepositorySchema),
				},
			},
		},
		201: {
			description: "新規お気に入り登録成功",
			content: {
				"application/json": {
					schema: successResponseSchema(favoriteRepositorySchema),
				},
			},
		},
		404: {
			description: "GitHubリポジトリが見つからない場合。",
			content: {
				"application/json": {
					schema: errorResponseSchema,
				},
			},
		},
	},
});

const getLikedArticlesRoute = createRoute({
	method: "get",
	path: "/users/me/liked-articles",
	summary: "ユーザーがいいねした記事一覧取得",
	description: `\
認証ユーザーがいいねした記事のリストを返します。
- 言語やページネーション、ソートも指定可能。
- 本APIは認証（Bearerトークン）が必須です。
`,
	security: [{ bearerAuth: [] }],
	tags: ["Favorites"],
	request: {
		query: z.object({
			lang: z.string().length(2).optional().openapi({
				description: "言語コード（2文字、例: 'ja'）",
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
			sort: z.enum(["likedAt_desc", "likedAt_asc"]).optional().openapi({
				description: "いいね日時でのソート順",
				example: "likedAt_desc",
			}),
		}),
	},
	responses: {
		200: {
			description: "取得成功",
			content: {
				"application/json": {
					schema: successResponseSchema(
						z.object({
							data: z.array(likedArticleInfoSchema),
							pagination: z.object({
								totalItems: z.number(),
								limit: z.number(),
								offset: z.number(),
							}),
						}),
					),
				},
			},
		},
		401: {
			description: "認証エラー。Bearerトークンが無効または未指定。",
			content: {
				"application/json": {
					schema: errorResponseSchema,
				},
			},
		},
	},
});

const getFavoriteReposRoute = createRoute({
	method: "get",
	path: "/users/me/favorite-repositories",
	summary: "お気に入りリポジトリ一覧取得",
	description: `\
認証ユーザーのお気に入りリポジトリ一覧を返します。
- ページネーション指定可。
- 本APIは認証（Bearerトークン）が必須です。
`,
	security: [{ bearerAuth: [] }],
	tags: ["Favorites"],
	request: {
		query: z.object({
			limit: z.string().optional().openapi({
				description: "取得件数",
				example: "20",
			}),
			offset: z.string().optional().openapi({
				description: "オフセット（スキップ件数）",
				example: "0",
			}),
		}),
	},
	responses: {
		200: {
			description: "取得成功",
			content: {
				"application/json": {
					schema: successResponseSchema(
						z.object({
							data: z.array(favoriteRepositorySchema),
							pagination: z.object({
								totalItems: z.number(),
								limit: z.number(),
								offset: z.number(),
							}),
						}),
					),
				},
			},
		},
		401: {
			description: "認証エラー。Bearerトークンが無効または未指定。",
			content: {
				"application/json": {
					schema: errorResponseSchema,
				},
			},
		},
	},
});

const deleteFavoriteRepoRoute = createRoute({
	method: "delete",
	path: "/users/me/favorite-repositories/{owner}/{repo}",
	summary: "お気に入りリポジトリ削除",
	description: `\\
指定したowner/repoのお気に入りリポジトリを削除します。
- 本APIは認証（Bearerトークン）が必須です。
`,
	security: [{ bearerAuth: [] }],
	tags: ["Favorites"],
	request: {
		params: z.object({
			owner: z.string().openapi({
				description: "リポジトリのオーナー名",
				example: "vercel",
			}),
			repo: z.string().openapi({
				description: "リポジトリ名",
				example: "next.js",
			}),
		}),
	},
	responses: {
		200: {
			description: "削除成功",
			content: {
				"application/json": {
					schema: successResponseSchema(z.object({ message: z.string() })),
				},
			},
		},
		401: {
			description: "認証エラー。Bearerトークンが無効または未指定。",
			content: {
				"application/json": {
					schema: errorResponseSchema,
				},
			},
		},
		404: {
			description: "指定リポジトリのお気に入りが存在しない場合。",
			content: {
				"application/json": {
					schema: errorResponseSchema,
				},
			},
		},
	},
});

const privateRoutes = createApp()
	.openapi(signupRoute, async (c) => {
		const { userService } = c.var;
		const body = c.req.valid("json");
		const user = c.var.user;
		if (!user) throw new HTTPException(401, { message: "Unauthenticated" });
		const result = await userService.createUser(user, body.language);
		if (result === "already_exists") {
			throw new HTTPException(409, { message: "User already exists" });
		}
		if (result === null) {
			throw new HTTPException(500, {
				message: "Failed to create/update user.",
			});
		}
		return c.json({ success: true as const, data: result }, 201);
	})
	.openapi(getMyProfileRoute, async (c) => {
		const { userService } = c.var;
		const user = c.var.user;
		if (!user) throw new HTTPException(401, { message: "Unauthenticated" });
		const userProfile = await userService.getCurrentUser(user);
		if (!userProfile) {
			throw new HTTPException(404, { message: "User profile not found" });
		}
		return c.json({ success: true as const, data: userProfile }, 200);
	})
	.openapi(logoutRoute, async (c) => {
		const { userService } = c.var;
		const user = c.var.user;
		if (!user) throw new HTTPException(401, { message: "Unauthenticated" });

		const result = await userService.logoutUser(user);
		if (!result.success) {
			throw new HTTPException(500, {
				message: result.message || "Logout failed",
			});
		}

		// Cookie削除
		deleteCookie(c, "auth-token", {
			path: "/",
			secure: process.env.NODE_ENV === "production",
			sameSite: "Lax",
		});

		return c.json({ success: true as const, data: {} }, 200);
	})
	.openapi(sessionRoute, async (c) => {
		const { userService } = c.var;
		const user = c.var.user;
		if (!user) throw new HTTPException(401, { message: "Unauthenticated" });
		const created = await userService.createSession(user);
		if (!created) {
			throw new HTTPException(500, { message: "Failed to create session" });
		}
		return c.json({ success: true as const, data: created }, 201);
	})
	.openapi(addFavoriteRepoRoute, async (c) => {
		const { userService } = c.var;
		const user = c.var.user;
		if (!user) throw new HTTPException(401, { message: "Unauthenticated" });
		const { owner, repo } = c.req.valid("json");
		const result = await userService.registerFavoriteRepository(
			user,
			owner,
			repo,
		);
		if (result.alreadyExists) {
			return c.json({ success: true as const, data: result.favorite }, 200);
		}
		return c.json({ success: true as const, data: result.favorite }, 201);
	})
	.openapi(getLikedArticlesRoute, async (c) => {
		const { prService } = c.var;
		const user = c.var.user;
		if (!user) throw new HTTPException(401, { message: "Unauthenticated" });
		const { lang, limit, offset, sort } = c.req.valid("query");
		const numLimit = limit ? Number(limit) : undefined;
		const numOffset = offset ? Number(offset) : undefined;
		const { data, totalItems } = await prService.getLikedArticles(user.id, {
			lang,
			limit: numLimit,
			offset: numOffset,
			sort,
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
	})
	.openapi(getFavoriteReposRoute, async (c) => {
		const { userService } = c.var;
		const user = c.var.user;
		if (!user) throw new HTTPException(401, { message: "Unauthenticated" });
		const { limit, offset } = c.req.valid("query");
		const numLimit = limit ? Number(limit) : 20;
		const numOffset = offset ? Number(offset) : 0;
		const { favorites, total } = await userService.getFavoriteRepositories(
			user.id,
			{ limit: numLimit, offset: numOffset },
		);
		return c.json(
			{
				success: true as const,
				data: {
					data: favorites,
					pagination: { totalItems: total, limit: numLimit, offset: numOffset },
				},
			},
			200,
		);
	})
	.openapi(deleteFavoriteRepoRoute, async (c) => {
		const { userService } = c.var;
		const user = c.var.user;
		if (!user) throw new HTTPException(401, { message: "Unauthenticated" });
		const { owner, repo } = c.req.valid("param");
		await userService.deleteFavoriteRepository(user.id, owner, repo);
		return c.json(
			{
				success: true as const,
				data: { message: "Favorite repository deleted successfully." },
			},
			200,
		);
	});

const userPrivateRoutes = createApp().route("/", privateRoutes);

export type UserPrivateRoutesType = typeof userPrivateRoutes;

export default userPrivateRoutes;
