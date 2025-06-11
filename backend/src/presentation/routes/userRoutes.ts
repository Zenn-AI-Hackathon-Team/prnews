import { createRoute, z } from "@hono/zod-openapi";
import {
	errorResponseSchema,
	favoriteRepositorySchema,
	likedArticleInfoSchema,
	successResponseSchema,
	userSchema,
	// 他必要なスキーマ
} from "@prnews/common";
import { getAuth } from "firebase-admin/auth";
import type { DecodedIdToken } from "firebase-admin/auth";
import { HTTPException } from "hono/http-exception";
import { createApp } from "../hono-app";
import { authMiddleware } from "../middlewares/authMiddleware";

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
					example: {
						success: true,
						data: {
							id: "11111111-1111-1111-1111-111111111111",
							githubUserId: 1,
							githubUsername: "foo",
							language: "ja",
							firebaseUid: "f1",
							githubDisplayName: "Foo Bar",
							email: "foo@example.com",
							avatarUrl: "http://example.com/avatar.png",
							createdAt: "2024-01-01T00:00:00Z",
							updatedAt: "2024-01-01T00:00:00Z",
						},
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
			description: "ユーザーが存在しない場合。",
			content: {
				"application/json": {
					schema: errorResponseSchema,
					example: {
						code: "HTTP_EXCEPTION",
						message: "User profile not found",
					},
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
					example: { success: true, data: {} },
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
		500: {
			description: "サーバーエラー。セッション無効化失敗など。",
			content: {
				"application/json": {
					schema: errorResponseSchema,
					example: { code: "INTERNAL_SERVER_ERROR", message: "Logout failed" },
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
					example: {
						success: true,
						data: {
							id: "11111111-1111-1111-1111-111111111111",
							githubUserId: 1,
							githubUsername: "foo",
							language: "ja",
							firebaseUid: "f1",
							githubDisplayName: "Foo Bar",
							email: "foo@example.com",
							avatarUrl: "http://example.com/avatar.png",
							createdAt: "2024-01-01T00:00:00Z",
							updatedAt: "2024-01-01T00:00:00Z",
						},
					},
				},
			},
		},
		409: {
			description: "既にユーザーが存在する場合。",
			content: {
				"application/json": {
					schema: errorResponseSchema,
					example: { code: "HTTP_EXCEPTION", message: "User already exists" },
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
		500: {
			description: "サーバーエラー。ユーザー作成失敗など。",
			content: {
				"application/json": {
					schema: errorResponseSchema,
					example: {
						code: "INTERNAL_SERVER_ERROR",
						message: "Failed to create user",
					},
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
					example: {
						success: true,
						data: {
							id: "session1",
							userId: "11111111-1111-1111-1111-111111111111",
						},
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
		500: {
			description: "サーバーエラー。セッション作成失敗など。",
			content: {
				"application/json": {
					schema: errorResponseSchema,
					example: {
						code: "INTERNAL_SERVER_ERROR",
						message: "Failed to create session",
					},
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
					example: {
						success: true,
						data: { id: "fav1", owner: "vercel", repo: "next.js" },
					},
				},
			},
		},
		201: {
			description: "新規お気に入り登録成功",
			content: {
				"application/json": {
					schema: successResponseSchema(favoriteRepositorySchema),
					example: {
						success: true,
						data: { id: "fav2", owner: "vercel", repo: "next.js" },
					},
				},
			},
		},
		404: {
			description: "GitHubリポジトリが見つからない場合。",
			content: {
				"application/json": {
					schema: errorResponseSchema,
					example: { code: "HTTP_EXCEPTION", message: "Repository not found" },
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
					example: {
						success: true,
						data: {
							data: [
								{
									id: "article1",
									title: "AI解説",
									lang: "ja",
									likedAt: "2024-01-01T00:00:00Z",
								},
							],
							pagination: { totalItems: 1, limit: 10, offset: 0 },
						},
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
					example: {
						success: true,
						data: {
							data: [{ id: "fav1", owner: "vercel", repo: "next.js" }],
							pagination: { totalItems: 1, limit: 20, offset: 0 },
						},
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
	},
});

const deleteFavoriteRepoRoute = createRoute({
	method: "delete",
	path: "/users/me/favorite-repositories/{favoriteId}",
	summary: "お気に入りリポジトリ削除",
	description: `\
指定したfavoriteIdのお気に入りリポジトリを削除します。
- 本APIは認証（Bearerトークン）が必須です。
`,
	security: [{ bearerAuth: [] }],
	tags: ["Favorites"],
	request: {
		params: z.object({
			favoriteId: z.string().min(1).openapi({
				description: "お気に入りリポジトリのID",
				example: "fav1",
			}),
		}),
	},
	responses: {
		200: {
			description: "削除成功",
			content: {
				"application/json": {
					schema: successResponseSchema(z.object({ message: z.string() })),
					example: {
						success: true,
						data: { message: "Favorite repository deleted successfully." },
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
			description: "指定IDのお気に入りリポジトリが存在しない場合。",
			content: {
				"application/json": {
					schema: errorResponseSchema,
					example: {
						code: "HTTP_EXCEPTION",
						message: "Favorite repository not found",
					},
				},
			},
		},
	},
});

const tokenExchangeRoute = createRoute({
	method: "post",
	path: "/auth/token/exchange",
	summary: "GitHubアクセストークン保存",
	description: `\
GitHubアクセストークンを保存します。
ユーザ作成時にGitHubアクセストークンを保存するためのAPIです。
ユーザ作成時は、まずこのAPIを呼び出して、GitHubアクセストークンを保存してください。
その後、ユーザ作成API(POST /auth/signup)を呼び出してください。
`,
	tags: ["User & Auth"],
	request: {
		body: {
			content: {
				"application/json": {
					schema: z.object({
						githubAccessToken: z.string().openapi({
							description: "GitHubのアクセストークン",
							example: "ghp_...",
						}),
					}),
				},
			},
		},
	},
	responses: {
		200: {
			description: "保存成功",
			content: {
				"application/json": {
					schema: successResponseSchema(z.object({ message: z.string() })),
					example: {
						success: true,
						data: { message: "Token saved successfully." },
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
		500: {
			description: "サーバーエラー。トークン保存失敗など。",
			content: {
				"application/json": {
					schema: errorResponseSchema,
					example: {
						code: "INTERNAL_SERVER_ERROR",
						message: "Failed to save token.",
					},
				},
			},
		},
	},
});

// 公開ルート（token/exchange のみ）
const publicRoutes = createApp().openapi(tokenExchangeRoute, async (c) => {
	const { userService } = c.var;
	const authHeader = c.req.header("Authorization");
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		throw new HTTPException(401, {
			message: "Bearer token is missing or invalid",
		});
	}
	const idToken = authHeader.substring(7);
	let decodedToken: DecodedIdToken;
	try {
		decodedToken = await getAuth().verifyIdToken(idToken);
	} catch (error) {
		throw new HTTPException(401, {
			message: "Invalid Firebase ID token",
			cause: error,
		});
	}
	const { githubAccessToken } = c.req.valid("json");
	if (!githubAccessToken) {
		throw new HTTPException(400, { message: "githubAccessToken is required" });
	}
	const result = await userService.saveGitHubToken(
		decodedToken.uid,
		githubAccessToken,
	);
	if (!result.success) {
		throw new HTTPException(500, { message: "Failed to save token." });
	}
	return c.json(
		{ success: true as const, data: { message: "Token saved successfully." } },
		200,
	);
});

// 保護ルート
const privateRoutes = createApp()
	.openapi(signupRoute, async (c) => {
		const { userService } = c.var;
		const authenticatedUser = c.var.user;
		if (!authenticatedUser) {
			throw new HTTPException(401, { message: "Unauthenticated" });
		}
		const body = c.req.valid("json");
		const result = await userService.createUser(
			authenticatedUser,
			body.language,
		);
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
		const authenticatedUser = c.var.user;
		if (!authenticatedUser) {
			throw new HTTPException(401, { message: "Unauthenticated" });
		}
		const userProfile = await userService.getCurrentUser(authenticatedUser);
		if (!userProfile) {
			throw new HTTPException(404, { message: "User profile not found" });
		}
		return c.json({ success: true as const, data: userProfile }, 200);
	})
	.openapi(logoutRoute, async (c) => {
		const { userService } = c.var;
		const authenticatedUser = c.var.user;
		if (!authenticatedUser) {
			throw new HTTPException(401, { message: "Unauthenticated" });
		}
		const result = await userService.logoutUser(authenticatedUser);
		if (!result.success) {
			throw new HTTPException(500, {
				message: result.message || "Logout failed",
			});
		}
		return c.json({ success: true as const, data: {} }, 200);
	})
	.openapi(sessionRoute, async (c) => {
		const { userService } = c.var;
		const authenticatedUser = c.var.user;
		if (!authenticatedUser) {
			throw new HTTPException(401, { message: "Unauthenticated" });
		}
		const created = await userService.createSession(authenticatedUser);
		if (!created) {
			throw new HTTPException(500, { message: "Failed to create session" });
		}
		return c.json({ success: true as const, data: created }, 201);
	})
	.openapi(addFavoriteRepoRoute, async (c) => {
		const { userService } = c.var;
		const authenticatedUser = c.var.user;
		if (!authenticatedUser) {
			throw new HTTPException(401, { message: "Unauthenticated" });
		}
		const { owner, repo } = c.req.valid("json");
		const result = await userService.registerFavoriteRepository(
			authenticatedUser,
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
		const authenticatedUser = c.var.user;
		if (!authenticatedUser) {
			throw new HTTPException(401, { message: "Unauthenticated" });
		}
		const { lang, limit, offset, sort } = c.req.valid("query");
		const numLimit = limit ? Number(limit) : undefined;
		const numOffset = offset ? Number(offset) : undefined;
		const { data, totalItems } = await prService.getLikedArticles(
			authenticatedUser.id,
			{ lang, limit: numLimit, offset: numOffset, sort },
		);
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
		const authenticatedUser = c.var.user;
		if (!authenticatedUser) {
			throw new HTTPException(401, { message: "Unauthenticated" });
		}
		const { limit, offset } = c.req.valid("query");
		const numLimit = limit ? Number(limit) : 20;
		const numOffset = offset ? Number(offset) : 0;
		const { favorites, total } = await userService.getFavoriteRepositories(
			authenticatedUser.id,
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
		const authenticatedUser = c.var.user;
		if (!authenticatedUser) {
			throw new HTTPException(401, { message: "Unauthenticated" });
		}
		const { favoriteId } = c.req.valid("param");
		await userService.deleteFavoriteRepository(
			authenticatedUser.id,
			favoriteId,
		);
		return c.json(
			{
				success: true as const,
				data: { message: "Favorite repository deleted successfully." },
			},
			200,
		);
	});

const userRoutes = createApp()
	.route("/", publicRoutes) // /auth/token/exchange は認証不要
	.use("/auth/signup", authMiddleware) // /auth/signup にミドルウェアを適用
	.use("/auth/session", authMiddleware) // /auth/session にミドルウェアを適用
	.use("/auth/logout", authMiddleware) // /auth/logout にミドルウェアを適用
	.use("/users/*", authMiddleware) // /users/以下の全パスにミドルウェアを適用
	.route("/", privateRoutes); // 保護ルートを定義

export default userRoutes;
