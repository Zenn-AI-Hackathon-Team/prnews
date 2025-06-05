import type { User } from "@prnews/common";
import { ErrorCode } from "@prnews/common";
import { createMiddleware } from "hono/factory";
import type { Dependencies } from "../../config/di";
import { respondError } from "../../utils/apiResponder";

export type AuthenticatedUser = Pick<User, "id" | "githubUsername"> & {
	firebaseUid: string;
};

export type AuthVariables = {
	user?: AuthenticatedUser;
};

export const authMiddleware = createMiddleware<{
	Variables: Dependencies & AuthVariables;
}>(async (c, next) => {
	const { auth, userRepo } = c.var;
	const authHeader = c.req.header("Authorization");

	if (!authHeader) {
		return respondError(
			c,
			ErrorCode.UNAUTHENTICATED,
			"Authorization header is missing",
		);
	}

	const [scheme, token] = authHeader.split(" ");
	if (scheme !== "Bearer" || !token) {
		return respondError(c, ErrorCode.UNAUTHENTICATED, "Invalid token format");
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
			return respondError(
				c,
				ErrorCode.UNAUTHENTICATED,
				"User not registered in this service",
			);
		}

		const authenticatedUser: AuthenticatedUser = {
			id: appUser.id,
			githubUsername: appUser.githubUsername,
			firebaseUid,
		};
		c.set("user", authenticatedUser);
		await next();
	} catch (error) {
		console.error("Token verification failed:", error);
		return respondError(
			c,
			ErrorCode.UNAUTHENTICATED,
			"Invalid or expired token",
		);
	}
});
