import type { User } from "@prnews/common";
import { getCookie } from "hono/cookie"; // Cookieを取得するヘルパーをインポート
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
	const sessionId = getCookie(c, "auth-token");

	if (!sessionId) {
		console.error("Middleware Error: Cookie 'auth-token' is missing!");
		throw new HTTPException(401, {
			message: "Authorization cookie is missing",
		});
	}

	const { authSessionRepo, userRepo } = c.var;

	const session = await authSessionRepo.findById(sessionId);

	if (
		!session ||
		session.revokedAt ||
		new Date(session.expiresAt) < new Date()
	) {
		console.error(
			"Middleware Error: Session not found in DB or is invalid/expired.",
		);
		throw new HTTPException(401, { message: "Session is invalid or expired" });
	}

	const appUser = await userRepo.findById(session.userId);

	if (!appUser) {
		console.error("Middleware Error: User for this session not found in DB.");
		throw new HTTPException(401, {
			message: "User associated with the session not found",
		});
	}

	// コンテキストに認証済みユーザー情報をセット
	const authenticatedUser: AuthenticatedUser = {
		id: appUser.id,
		githubUsername: appUser.githubUsername,
		firebaseUid: appUser.firebaseUid,
		githubDisplayName: appUser.githubDisplayName,
		email: appUser.email,
		avatarUrl: appUser.avatarUrl,
	};
	c.set("user", authenticatedUser);

	await next();
});
