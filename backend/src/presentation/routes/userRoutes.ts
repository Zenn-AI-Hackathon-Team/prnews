import { ErrorCode, userSchema } from "@prnews/common";
import { Hono } from "hono";
import { validator } from "hono/validator";
import { z } from "zod";
import type { Dependencies } from "../../config/di";
import { respondError, respondSuccess } from "../../utils/apiResponder";
import type { AuthVariables } from "../middlewares/authMiddleware";
import { authMiddleware } from "../middlewares/authMiddleware";

const userRoutes = new Hono<{ Variables: Dependencies & AuthVariables }>();

const deleteFavoriteParamsSchema = z.object({
	favoriteId: z.string().min(1, "favoriteId is required"),
});

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
		const body = await c.req.json().catch(() => ({}));
		const language =
			typeof body.language === "string" ? body.language : undefined;
		const created = await userService.createUser(authenticatedUser, language);
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

userRoutes.post("/users/me/favorite-repositories", async (c) => {
	const { userService } = c.var;
	const authenticatedUser = c.var.user;
	if (!authenticatedUser) {
		return respondError(c, ErrorCode.UNAUTHENTICATED, "User not authenticated");
	}
	let body: Record<string, unknown>;
	try {
		body = await c.req.json();
	} catch {
		return respondError(c, ErrorCode.VALIDATION_ERROR, "Invalid JSON body");
	}
	const { owner, repo } = body || {};
	if (
		typeof owner !== "string" ||
		typeof repo !== "string" ||
		!owner ||
		!repo
	) {
		return respondError(c, ErrorCode.VALIDATION_ERROR, "ownerとrepoは必須です");
	}
	const result = await userService.registerFavoriteRepository(
		authenticatedUser,
		owner,
		repo,
	);
	if ("error" in result) {
		return respondError(
			c,
			ErrorCode.INTERNAL_SERVER_ERROR,
			"お気に入り登録に失敗しました",
		);
	}
	if (result.alreadyExists) {
		return respondSuccess(
			c,
			result.favorite,
			200,
			"既にお気に入り登録済みです",
		);
	}
	return respondSuccess(
		c,
		result.favorite,
		201,
		"お気に入り登録が完了しました",
	);
});

userRoutes.get("/users/me/liked-articles", async (c) => {
	const { prService } = c.var;
	const authenticatedUser = c.var.user;
	if (!authenticatedUser) {
		return respondError(c, ErrorCode.UNAUTHENTICATED, "User not authenticated");
	}
	const lang = c.req.query("lang");
	const limit = c.req.query("limit") ? Number(c.req.query("limit")) : undefined;
	const offset = c.req.query("offset")
		? Number(c.req.query("offset"))
		: undefined;
	const sort = c.req.query("sort") as
		| "likedAt_desc"
		| "likedAt_asc"
		| undefined;
	const { data, totalItems } = await prService.getLikedArticles(
		authenticatedUser.id,
		{ lang, limit, offset, sort },
	);
	return respondSuccess(c, {
		data,
		pagination: { totalItems, limit: limit ?? 10, offset: offset ?? 0 },
	});
});

userRoutes.get("/users/me/favorite-repositories", async (c) => {
	const { userService } = c.var;
	const authenticatedUser = c.var.user;
	if (!authenticatedUser) {
		return respondError(c, ErrorCode.UNAUTHENTICATED, "User not authenticated");
	}
	const limit = c.req.query("limit") ? Number(c.req.query("limit")) : 20;
	const offset = c.req.query("offset") ? Number(c.req.query("offset")) : 0;
	try {
		const { favorites, total } = await userService.getFavoriteRepositories(
			authenticatedUser.id,
			{ limit, offset },
		);
		return respondSuccess(c, {
			data: favorites,
			pagination: { totalItems: total, limit, offset },
		});
	} catch (error) {
		console.error("Get /users/me/favorite-repositories failed:", error);
		return respondError(
			c,
			ErrorCode.INTERNAL_SERVER_ERROR,
			"Failed to get favorite repositories",
		);
	}
});

userRoutes.post(
	"/auth/token/exchange",
	authMiddleware, // どのユーザーのトークンか特定するために認証は必須
	async (c) => {
		const { userService } = c.var;
		const authenticatedUser = c.var.user;
		let githubAccessToken: string | undefined;
		try {
			const body = await c.req.json();
			if (body && typeof body.githubAccessToken === "string") {
				githubAccessToken = body.githubAccessToken;
			}
		} catch {
			// パース失敗時はundefinedのまま
		}

		if (!authenticatedUser || !githubAccessToken) {
			return respondError(c, ErrorCode.VALIDATION_ERROR, "Invalid request");
		}

		const result = await userService.saveGitHubToken(
			authenticatedUser.id,
			githubAccessToken,
		);

		if (result.success) {
			return respondSuccess(c, { message: "Token saved successfully." });
		}
		return respondError(
			c,
			ErrorCode.INTERNAL_SERVER_ERROR,
			"Failed to save token.",
		);
	},
);

userRoutes.delete(
	"/users/me/favorite-repositories/:favoriteId",
	validator("param", (value, c) => {
		const parsed = deleteFavoriteParamsSchema.safeParse(value);
		if (!parsed.success) {
			return respondError(
				c,
				ErrorCode.VALIDATION_ERROR,
				"Invalid favoriteId",
				parsed.error.flatten().fieldErrors,
				422,
			);
		}
		return parsed.data;
	}),
	async (c) => {
		const { userService } = c.var;
		const authenticatedUser = c.var.user;
		if (!authenticatedUser) {
			return respondError(
				c,
				ErrorCode.UNAUTHENTICATED,
				"User not authenticated",
			);
		}
		const { favoriteId } = c.req.valid("param");
		try {
			const result = await userService.deleteFavoriteRepository(
				authenticatedUser.id,
				favoriteId,
			);
			if (!result.success) {
				if (result.error === "FORBIDDEN") {
					return respondError(
						c,
						ErrorCode.FORBIDDEN,
						"Forbidden",
						undefined,
						403,
					);
				}
				return respondError(
					c,
					ErrorCode.NOT_FOUND,
					"Favorite repository not found",
					undefined,
					404,
				);
			}
			return respondSuccess(c, {
				message: "Favorite repository deleted successfully.",
			});
		} catch (error) {
			console.error(
				"Delete /users/me/favorite-repositories/:favoriteId failed:",
				error,
			);
			return respondError(
				c,
				ErrorCode.INTERNAL_SERVER_ERROR,
				"Failed to delete favorite repository",
			);
		}
	},
);

export default userRoutes;
