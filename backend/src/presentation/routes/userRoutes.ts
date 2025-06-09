import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import {
	errorResponseSchema,
	favoriteRepositorySchema,
	likedArticleInfoSchema,
	successResponseSchema,
	userSchema,
	// 他必要なスキーマ
} from "@prnews/common";
import { HTTPException } from "hono/http-exception";
import type { Dependencies } from "../../config/di";
import type { AuthVariables } from "../middlewares/authMiddleware";

const userRoutes = new OpenAPIHono<{
	Variables: Dependencies & AuthVariables;
}>();

// --- GET /users/me ---
const getMyProfileRoute = createRoute({
	method: "get",
	path: "/users/me",
	summary: "現在のユーザー情報を取得",
	description: "認証済みユーザーのプロフィール情報を返す。",
	security: [{ bearerAuth: [] }],
	tags: ["User & Auth"],
	responses: {
		200: {
			description: "ユーザー情報の取得成功",
			content: {
				"application/json": { schema: successResponseSchema(userSchema) },
			},
		},
		401: {
			description: "認証エラー",
			content: { "application/json": { schema: errorResponseSchema } },
		},
		404: {
			description: "ユーザー未発見",
			content: { "application/json": { schema: errorResponseSchema } },
		},
	},
});
userRoutes.openapi(getMyProfileRoute, async (c) => {
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
});

// --- POST /auth/logout ---
const logoutRoute = createRoute({
	method: "post",
	path: "/auth/logout",
	summary: "ログアウト",
	description: "現在のユーザーのセッションを無効化する。",
	security: [{ bearerAuth: [] }],
	tags: ["User & Auth"],
	responses: {
		200: {
			description: "ログアウト成功",
			content: {
				"application/json": { schema: successResponseSchema(z.object({})) },
			},
		},
		401: {
			description: "認証エラー",
			content: { "application/json": { schema: errorResponseSchema } },
		},
		500: {
			description: "サーバーエラー",
			content: { "application/json": { schema: errorResponseSchema } },
		},
	},
});
userRoutes.openapi(logoutRoute, async (c) => {
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
});

// --- POST /auth/signup ---
const signupRoute = createRoute({
	method: "post",
	path: "/auth/signup",
	summary: "ユーザー登録（サインアップ）",
	description: "認証済みユーザーの初回登録。既存の場合は409。",
	security: [{ bearerAuth: [] }],
	tags: ["User & Auth"],
	request: {
		body: {
			content: {
				"application/json": {
					schema: z.object({ language: z.string().length(2).optional() }),
				},
			},
		},
	},
	responses: {
		201: {
			description: "ユーザー作成成功",
			content: {
				"application/json": { schema: successResponseSchema(userSchema) },
			},
		},
		409: {
			description: "既に存在",
			content: { "application/json": { schema: errorResponseSchema } },
		},
		401: {
			description: "認証エラー",
			content: { "application/json": { schema: errorResponseSchema } },
		},
		500: {
			description: "サーバーエラー",
			content: { "application/json": { schema: errorResponseSchema } },
		},
	},
});
userRoutes.openapi(signupRoute, async (c) => {
	const { userService } = c.var;
	const authenticatedUser = c.var.user;
	if (!authenticatedUser) {
		throw new HTTPException(401, { message: "Unauthenticated" });
	}
	const body = c.req.valid("json");
	const language =
		typeof body.language === "string" ? body.language : undefined;
	const created = await userService.createUser(authenticatedUser, language);
	if (!created) {
		const already = await userService.getCurrentUser(authenticatedUser);
		if (already) {
			throw new HTTPException(409, { message: "User already exists" });
		}
		throw new HTTPException(500, { message: "Failed to create user" });
	}
	return c.json({ success: true as const, data: created }, 201);
});

// --- POST /auth/session ---
const sessionRoute = createRoute({
	method: "post",
	path: "/auth/session",
	summary: "セッション作成",
	description: "認証済みユーザーのセッションを新規作成する。",
	security: [{ bearerAuth: [] }],
	tags: ["User & Auth"],
	responses: {
		201: {
			description: "セッション作成成功",
			content: {
				"application/json": { schema: successResponseSchema(z.any()) },
			},
		},
		401: {
			description: "認証エラー",
			content: { "application/json": { schema: errorResponseSchema } },
		},
		500: {
			description: "サーバーエラー",
			content: { "application/json": { schema: errorResponseSchema } },
		},
	},
});
userRoutes.openapi(sessionRoute, async (c) => {
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
});

// --- POST /users/me/favorite-repositories ---
const addFavoriteRepoRoute = createRoute({
	method: "post",
	path: "/users/me/favorite-repositories",
	summary: "お気に入りリポジトリを登録",
	description:
		"ユーザーのお気に入りリポジトリを追加する。既に登録済みなら200、新規なら201。",
	security: [{ bearerAuth: [] }],
	tags: ["Favorites"],
	request: {
		body: {
			content: {
				"application/json": {
					schema: z.object({
						owner: z.string().openapi({ example: "vercel" }),
						repo: z.string().openapi({ example: "next.js" }),
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
			description: "GitHubリポジトリが見つからない",
			content: { "application/json": { schema: errorResponseSchema } },
		},
	},
});
userRoutes.openapi(addFavoriteRepoRoute, async (c) => {
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
});

// --- GET /users/me/liked-articles ---
const getLikedArticlesRoute = createRoute({
	method: "get",
	path: "/users/me/liked-articles",
	summary: "ユーザーがいいねした記事一覧取得",
	description: "認証ユーザーがいいねした記事のリストを返す。",
	security: [{ bearerAuth: [] }],
	tags: ["Favorites"],
	request: {
		query: z.object({
			lang: z.string().length(2).optional(),
			limit: z.string().optional(),
			offset: z.string().optional(),
			sort: z.enum(["likedAt_desc", "likedAt_asc"]).optional(),
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
			description: "認証エラー",
			content: { "application/json": { schema: errorResponseSchema } },
		},
	},
});
userRoutes.openapi(getLikedArticlesRoute, async (c) => {
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
});

// --- GET /users/me/favorite-repositories ---
const getFavoriteReposRoute = createRoute({
	method: "get",
	path: "/users/me/favorite-repositories",
	summary: "お気に入りリポジトリ一覧取得",
	description: "認証ユーザーのお気に入りリポジトリ一覧を返す。",
	security: [{ bearerAuth: [] }],
	tags: ["Favorites"],
	request: {
		query: z.object({
			limit: z.string().optional(),
			offset: z.string().optional(),
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
			description: "認証エラー",
			content: { "application/json": { schema: errorResponseSchema } },
		},
	},
});
userRoutes.openapi(getFavoriteReposRoute, async (c) => {
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
});

// --- DELETE /users/me/favorite-repositories/:favoriteId ---
const deleteFavoriteRepoRoute = createRoute({
	method: "delete",
	path: "/users/me/favorite-repositories/{favoriteId}",
	summary: "お気に入りリポジトリ削除",
	description: "指定したfavoriteIdのお気に入りリポジトリを削除する。",
	security: [{ bearerAuth: [] }],
	tags: ["Favorites"],
	request: {
		params: z.object({ favoriteId: z.string().min(1) }),
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
			description: "認証エラー",
			content: { "application/json": { schema: errorResponseSchema } },
		},
		404: {
			description: "未発見",
			content: { "application/json": { schema: errorResponseSchema } },
		},
	},
});
userRoutes.openapi(deleteFavoriteRepoRoute, async (c) => {
	const { userService } = c.var;
	const authenticatedUser = c.var.user;
	if (!authenticatedUser) {
		throw new HTTPException(401, { message: "Unauthenticated" });
	}
	const { favoriteId } = c.req.valid("param");
	await userService.deleteFavoriteRepository(authenticatedUser.id, favoriteId);
	return c.json(
		{
			success: true as const,
			data: { message: "Favorite repository deleted successfully." },
		},
		200,
	);
});

// --- POST /auth/token/exchange ---
const tokenExchangeRoute = createRoute({
	method: "post",
	path: "/auth/token/exchange",
	summary: "GitHubアクセストークン保存",
	description: "GitHubアクセストークンを保存する。",
	security: [{ bearerAuth: [] }],
	tags: ["User & Auth"],
	request: {
		body: {
			content: {
				"application/json": {
					schema: z.object({ githubAccessToken: z.string() }),
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
				},
			},
		},
		401: {
			description: "認証エラー",
			content: { "application/json": { schema: errorResponseSchema } },
		},
		500: {
			description: "サーバーエラー",
			content: { "application/json": { schema: errorResponseSchema } },
		},
	},
});
userRoutes.openapi(tokenExchangeRoute, async (c) => {
	const { userService } = c.var;
	const authenticatedUser = c.var.user;
	const { githubAccessToken } = c.req.valid("json");
	if (!authenticatedUser || !githubAccessToken) {
		throw new HTTPException(401, { message: "Invalid request" });
	}
	const result = await userService.saveGitHubToken(
		authenticatedUser.id,
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

export default userRoutes;
