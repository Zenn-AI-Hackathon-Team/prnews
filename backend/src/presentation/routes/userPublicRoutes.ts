import { createRoute, z } from "@hono/zod-openapi";
import { errorResponseSchema, successResponseSchema } from "@prnews/common";
import { getAuth } from "firebase-admin/auth";
import type { DecodedIdToken } from "firebase-admin/auth";
import { setCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import { createApp } from "../hono-app";

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
	security: [{ bearerAuth: [] }],
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
				},
			},
		},
		400: {
			description: "リクエストボディが不正",
			content: { "application/json": { schema: errorResponseSchema } },
		},
		401: {
			description: "認証エラー。Bearerトークンが無効または未指定。",
			content: { "application/json": { schema: errorResponseSchema } },
		},
		500: {
			description: "サーバーエラー。トークン保存失敗など。",
			content: { "application/json": { schema: errorResponseSchema } },
		},
	},
});

// 新しいセッション作成エンドポイント
const createSessionRoute = createRoute({
	method: "post",
	path: "/auth/session/create",
	summary: "セッション作成（Cookie設定）",
	description: `\
Firebaseトークンを検証し、HttpOnly Cookieとしてセッショントークンを設定します。
`,
	tags: ["User & Auth"],
	request: {
		body: {
			content: {
				"application/json": {
					schema: z.object({
						firebaseToken: z.string().openapi({
							description: "Firebase IDトークン",
							example: "eyJhbGciOiJSUzI1NiIsImtpZCI6...",
						}),
					}),
				},
			},
		},
	},
	responses: {
		200: {
			description: "セッション作成成功",
			content: {
				"application/json": {
					schema: successResponseSchema(
						z.object({
							message: z.string(),
							userId: z.string(),
						}),
					),
				},
			},
		},
		401: {
			description: "認証エラー。Firebaseトークンが無効。",
			content: { "application/json": { schema: errorResponseSchema } },
		},
		500: {
			description: "サーバーエラー。",
			content: { "application/json": { schema: errorResponseSchema } },
		},
	},
});

const userPublicRoutes = createApp()
	.openapi(tokenExchangeRoute, async (c) => {
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
				message: "Invalid or expired token",
				cause: error,
			});
		}

		const { githubAccessToken } = c.req.valid("json");
		if (!githubAccessToken) {
			throw new HTTPException(400, {
				message: "githubAccessToken is required",
			});
		}

		const result = await userService.saveGitHubToken(
			decodedToken.uid,
			githubAccessToken,
		);

		if (!result.success) {
			throw new HTTPException(500, { message: "Failed to save token." });
		}

		return c.json(
			{
				success: true as const,
				data: { message: "Token saved successfully." },
			},
			200,
		);
	})
	.openapi(createSessionRoute, async (c) => {
		const { userService } = c.var;
		const { firebaseToken } = c.req.valid("json");

		let decodedToken: DecodedIdToken;
		try {
			decodedToken = await getAuth().verifyIdToken(firebaseToken);
		} catch (error) {
			throw new HTTPException(401, {
				message: "Invalid or expired Firebase token",
				cause: error,
			});
		}

		// ユーザー情報を取得
		const user = await userService.getCurrentUser({
			id: decodedToken.uid,
			firebaseUid: decodedToken.uid,
			githubUsername: decodedToken.name || "",
			email: decodedToken.email,
		});

		if (!user) {
			throw new HTTPException(401, {
				message: "User not found",
			});
		}

		// HttpOnly Cookieを設定
		setCookie(c, "auth-token", firebaseToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: 60 * 60 * 24 * 7, // 7日間
			path: "/",
		});

		return c.json(
			{
				success: true as const,
				data: {
					message: "Session created successfully",
					userId: user.id,
				},
			},
			200,
		);
	});

export type UserPublicRoutesType = typeof userPublicRoutes;

export default userPublicRoutes;
