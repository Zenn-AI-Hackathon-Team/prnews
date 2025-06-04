import type { User } from "@prnews/common";
import { ErrorCode } from "@prnews/common";
import { createMiddleware } from "hono/factory";
import { respondError } from "../../utils/apiResponder";

export type AuthenticatedUser = Pick<User, "id" | "githubUsername"> & {
	firebaseUid: string;
};

export type AuthVariables = {
	user?: AuthenticatedUser;
};

export const authMiddleware = createMiddleware<{ Variables: AuthVariables }>(
	async (c, next) => {
		const authHeader = c.req.header("Authorization");

		if (!authHeader) {
			console.log("[AuthMiddleware] Authorization header missing");
			return respondError(
				c,
				ErrorCode.UNAUTHENTICATED,
				"Authorization header is missing",
			);
		}

		const [scheme, token] = authHeader.split(" ");

		if (scheme !== "Bearer" || !token) {
			console.log("[AuthMiddleware] Invalid token scheme or token missing");
			return respondError(
				c,
				ErrorCode.UNAUTHENTICATED,
				"Invalid token format. Expected 'Bearer <token>'",
			);
		}

		// --- ダミーのトークン検証 ---
		console.log(`[AuthMiddleware] Received token: ${token}`);
		let DUMMY_USER_ID = "11111111-1111-1111-1111-111111111111";
		let DUMMY_GITHUB_USERNAME = "dummy-github-user";
		let DUMMY_FIREBASE_UID = "dummy-firebase-uid";

		if (token === "valid-dummy-token-for-alice") {
			DUMMY_USER_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
			DUMMY_GITHUB_USERNAME = "alice_gh";
			DUMMY_FIREBASE_UID = "alice-firebase-uid";
		} else if (token === "valid-dummy-token-for-bob") {
			DUMMY_USER_ID = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
			DUMMY_GITHUB_USERNAME = "bob_gh";
			DUMMY_FIREBASE_UID = "bob-firebase-uid";
		} else if (token === "invalid-dummy-token") {
			console.log("[AuthMiddleware] Dummy token deemed invalid");
			return respondError(
				c,
				ErrorCode.UNAUTHENTICATED,
				"Invalid token (dummy validation)",
			);
		}
		// --- ここまでダミーのトークン検証 ---

		const authenticatedUser: AuthenticatedUser = {
			id: DUMMY_USER_ID,
			githubUsername: DUMMY_GITHUB_USERNAME,
			firebaseUid: DUMMY_FIREBASE_UID,
		};

		c.set("user", authenticatedUser);
		console.log("[AuthMiddleware] User set in context:", authenticatedUser);

		await next();
	},
);
