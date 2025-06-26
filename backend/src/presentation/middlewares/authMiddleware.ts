import type { User } from "@prnews/common";
import { getCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import type { Dependencies } from "../../config/di";

export type AuthenticatedUser = Pick<User, "id" | "githubUsername"> & {
	firebaseUid: string;
	githubDisplayName?: string | null;
	email?: string | null;
	avatarUrl?: string | null;
};

export type AuthVariables = {
	user?: AuthenticatedUser;
};

export const authMiddleware = createMiddleware<{
	Variables: Dependencies & AuthVariables;
}>(async (c, next) => {
	const { auth, userRepo } = c.var;

	// 1. まずCookieからトークンを取得
	let token = getCookie(c, "auth-token");

	// 2. Cookieがない場合はAuthorizationヘッダーから取得（API利用時用）
	if (!token) {
		const authHeader = c.req.header("Authorization");
		if (!authHeader) {
			throw new HTTPException(401, {
				message: "Authorization header or cookie is missing",
			});
		}

		const [scheme, headerToken] = authHeader.split(" ");
		if (scheme !== "Bearer" || !headerToken) {
			throw new HTTPException(401, { message: "Invalid token format" });
		}
		token = headerToken;
	}

	try {
		// Firebase IDトークンを検証
		const decodedToken = await auth.verifyIdToken(token);
		const firebaseUid = decodedToken.uid;

		// アプリDBからユーザー検索
		const appUser = await userRepo.findByFirebaseUid(firebaseUid);
		if (!appUser) {
			console.warn(
				`User with firebaseUid ${firebaseUid} not found in app database.`,
			);
			throw new HTTPException(401, {
				message: "User not registered in this service",
			});
		}

		const authenticatedUser: AuthenticatedUser = {
			id: appUser.id,
			githubUsername: appUser.githubUsername,
			firebaseUid,
			githubDisplayName: appUser.githubDisplayName,
			email: appUser.email,
			avatarUrl: appUser.avatarUrl,
		};
		c.set("user", authenticatedUser);
		await next();
	} catch (error) {
		console.error("Token verification failed:", error);
		throw new HTTPException(401, { message: "Invalid or expired token" });
	}
});
