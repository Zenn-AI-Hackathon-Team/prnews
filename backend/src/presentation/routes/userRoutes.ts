import { ErrorCode, userSchema } from "@prnews/common";
import { Hono } from "hono";
import type { Dependencies } from "../../config/di";
import { respondError, respondSuccess } from "../../utils/apiResponder";
import type { AuthVariables } from "../middlewares/authMiddleware";

const userRoutes = new Hono<{ Variables: Dependencies & AuthVariables }>();

userRoutes.get("/users/me", async (c) => {
	const { userService } = c.var;
	const authenticatedUser = c.var.user;
	if (!authenticatedUser) {
		return respondError(
			c,
			ErrorCode.UNAUTHENTICATED,
			"User not authenticated (should be caught by middleware)",
		);
	}
	try {
		const userProfile = await userService.getCurrentUser(authenticatedUser);
		if (!userProfile) {
			return respondError(c, ErrorCode.NOT_FOUND, "User profile not found");
		}
		const validatedResponse = userSchema.safeParse(userProfile);
		if (!validatedResponse.success) {
			console.error(
				"User profile response validation failed:",
				validatedResponse.error,
			);
			return respondError(
				c,
				ErrorCode.INTERNAL_SERVER_ERROR,
				"User profile data validation failed on server",
			);
		}
		return respondSuccess(c, validatedResponse.data);
	} catch (error: unknown) {
		console.error("Get /users/me failed:", error);
		return respondError(
			c,
			ErrorCode.INTERNAL_SERVER_ERROR,
			"Failed to get user profile",
		);
	}
});

userRoutes.post("/auth/logout", async (c) => {
	const { userService } = c.var;
	const authenticatedUser = c.var.user;
	if (!authenticatedUser) {
		return respondError(c, ErrorCode.UNAUTHENTICATED, "User not authenticated");
	}
	try {
		const result = await userService.logoutUser(authenticatedUser);
		if (result.success) {
			return respondSuccess(c, {}, 200, result.message);
		}
		return respondError(
			c,
			ErrorCode.INTERNAL_SERVER_ERROR,
			result.message || "Logout failed",
		);
	} catch (error: unknown) {
		console.error("Logout failed:", error);
		return respondError(c, ErrorCode.INTERNAL_SERVER_ERROR, "Failed to logout");
	}
});

userRoutes.post("/auth/signup", async (c) => {
	const { userService } = c.var;
	const authenticatedUser = c.var.user;
	if (!authenticatedUser) {
		return respondError(c, ErrorCode.UNAUTHENTICATED, "User not authenticated");
	}
	try {
		const created = await userService.createUser(authenticatedUser);
		if (!created) {
			// 既に存在する場合は409、それ以外は500
			const already = await userService.getCurrentUser(authenticatedUser);
			if (already) {
				return respondError(
					c,
					ErrorCode.VALIDATION_ERROR,
					"User already exists",
					undefined,
					409,
				);
			}
			return respondError(
				c,
				ErrorCode.INTERNAL_SERVER_ERROR,
				"Failed to create user",
			);
		}
		return respondSuccess(c, created, 201, "User created successfully");
	} catch (error: unknown) {
		console.error("Signup failed:", error);
		return respondError(
			c,
			ErrorCode.INTERNAL_SERVER_ERROR,
			"Failed to signup user",
		);
	}
});

userRoutes.post("/auth/session", async (c) => {
	const { userService } = c.var;
	const authenticatedUser = c.var.user;
	if (!authenticatedUser) {
		return respondError(c, ErrorCode.UNAUTHENTICATED, "User not authenticated");
	}
	try {
		const created = await userService.createSession(authenticatedUser);
		if (!created) {
			return respondError(
				c,
				ErrorCode.INTERNAL_SERVER_ERROR,
				"Failed to create session",
			);
		}
		return respondSuccess(c, created, 201, "Session created successfully");
	} catch (error: unknown) {
		console.error("Session create failed:", error);
		return respondError(
			c,
			ErrorCode.INTERNAL_SERVER_ERROR,
			"Failed to create session",
		);
	}
});

export default userRoutes;
