import { createRoute, z } from "@hono/zod-openapi";
import { errorResponseSchema, successResponseSchema } from "@prnews/common";
import { getAuth } from "firebase-admin/auth";
import type { DecodedIdToken } from "firebase-admin/auth";
import { setCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import { createApp } from "../hono-app";

// 新しいログイン用のルート定義
const loginRoute = createRoute({
	method: "post",
	path: "/auth/login",
	summary: "ログインとセッション作成",
	description:
		"FirebaseとGitHubのトークンを受け取り、ユーザーを認証/登録し、セッションCookieを設定します。",
	tags: ["User & Auth"],
	request: {
		body: {
			content: {
				"application/json": {
					schema: z.object({
						firebaseToken: z.string(),
						githubAccessToken: z.string(),
					}),
				},
			},
		},
	},
	responses: {
		200: {
			description: "ログイン成功",
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

const userPublicRoutes = createApp().openapi(loginRoute, async (c) => {
	const { userService, userRepo } = c.var;
	const { firebaseToken, githubAccessToken } = c.req.valid("json");

	// 1. Firebaseトークンを検証
	let decodedToken: DecodedIdToken;
	try {
		decodedToken = await getAuth().verifyIdToken(firebaseToken);
	} catch (error) {
		throw new HTTPException(401, {
			message: "Invalid or expired Firebase token",
			cause: error,
		});
	}

	// 2. ユーザーの仮登録とGitHubトークンの保存
	await userService.saveGitHubToken(decodedToken.uid, githubAccessToken);

	// 3. ユーザーの本登録（情報の完全化）
	let user = await userRepo.findByFirebaseUid(decodedToken.uid);
	if (!user) {
		throw new HTTPException(500, {
			message: "Failed to create provisional user.",
		});
	}
	if (user.githubUserId === 0) {
		const authUser = {
			id: user.id,
			firebaseUid: user.firebaseUid,
			githubUsername: "",
		};
		const updatedUser = await userService.createUser(authUser, user.language);
		if (updatedUser && updatedUser !== "already_exists") {
			user = updatedUser;
		}
	}

	const finalUser = await userRepo.findByFirebaseUid(decodedToken.uid);
	if (!finalUser) {
		throw new HTTPException(401, { message: "User not fully registered." });
	}

	// 4. セッションを作成してDBに保存
	const session = await userService.createSession({
		id: finalUser.id,
		firebaseUid: finalUser.firebaseUid,
		githubUsername: finalUser.githubUsername,
	});
	if (!session) {
		throw new HTTPException(500, { message: "Failed to create session." });
	}

	// 5. Cookieにセッショントークン（セッションID）を設定
	setCookie(c, "auth-token", session.id, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "Lax",
		path: "/",
		maxAge: 60 * 60 * 24 * 14, // 14日間
	});

	return c.json(
		{ success: true, data: { message: "Login successful." } } as const,
		200,
	);
});

export type UserPublicRoutesType = typeof userPublicRoutes;
export default userPublicRoutes;
