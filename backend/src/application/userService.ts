import { randomUUID } from "node:crypto";
import {
	type AuthSession,
	type FavoriteRepository,
	userSchema as UserSchema,
	type User as UserSchemaType,
} from "@prnews/common";
import { favoriteRepositorySchema } from "@prnews/common";
import { HTTPException } from "hono/http-exception";
import type { AuthSessionRepoPort } from "../ports/authSessionRepoPort";
import type { FavoriteRepositoryRepoPort } from "../ports/favoriteRepositoryRepoPort.js";
import type { GithubPort } from "../ports/githubPort.js";
import type { UserRepoPort } from "../ports/userRepoPort";
import type { AuthenticatedUser } from "../presentation/middlewares/authMiddleware";
import { decrypt, encrypt } from "../utils/crypto";

export const createUserService = (deps: {
	userRepo: UserRepoPort;
	authSessionRepo: AuthSessionRepoPort;
	favoriteRepositoryRepo: FavoriteRepositoryRepoPort;
	githubPort: GithubPort;
}) => {
	const getCurrentUser = async (
		authenticatedUser: AuthenticatedUser | undefined,
	): Promise<UserSchemaType | null> => {
		if (!authenticatedUser) {
			console.error(
				"[UserService] getCurrentUser called without authenticatedUser. This should have been caught by authMiddleware.",
			);
			return null;
		}
		const user = await deps.userRepo.findById(authenticatedUser.id);
		if (user) {
			console.log(
				`[UserService] Found existing user in DB for ID (${authenticatedUser.id}):`,
				user,
			);
			return user;
		}
		console.log(
			`[UserService] User with ID (${authenticatedUser.id}) not found in DB. Returning null.`,
		);
		return null;
	};

	const logoutUser = async (
		authenticatedUser: AuthenticatedUser | undefined,
	): Promise<{ success: boolean; message: string }> => {
		if (!authenticatedUser) {
			console.warn("[UserService] logoutUser called without authenticatedUser");
			return { success: false, message: "User not authenticated." };
		}
		console.log(
			`[UserService] Attempting to logout user: ${authenticatedUser.githubUsername} (FirebaseUID: ${authenticatedUser.firebaseUid})`,
		);
		const currentSession =
			await deps.authSessionRepo.findByFirebaseUidActiveSession(
				authenticatedUser.firebaseUid,
			);
		if (!currentSession) {
			console.warn(
				`[UserService] No active session found for FirebaseUID ${authenticatedUser.firebaseUid} to revoke. Proceeding as logged out.`,
			);
			return {
				success: true,
				message: "No active session found, but considered logged out.",
			};
		}
		const now = new Date().toISOString();
		const sessionToUpdate = {
			...currentSession,
			revokedAt: now,
		};
		const updatedSession = await deps.authSessionRepo.update(sessionToUpdate);
		if (!updatedSession) {
			console.error(
				`[UserService] Failed to update session ${currentSession.id} for logout.`,
			);
			return { success: false, message: "Failed to revoke session." };
		}
		console.log(
			`[UserService] Session ${updatedSession.id} for FirebaseUID ${authenticatedUser.firebaseUid} has been revoked at ${updatedSession.revokedAt}.`,
		);
		return {
			success: true,
			message: "Logged out successfully. Session revoked.",
		};
	};

	const createUser = async (
		authenticatedUser: AuthenticatedUser | undefined,
		language?: string,
	): Promise<UserSchemaType | null> => {
		if (!authenticatedUser) {
			console.error(
				"[UserService] createUser called without authenticatedUser.",
			);
			return null;
		}
		// 既存ユーザーのチェック
		const existingUser = await deps.userRepo.findByFirebaseUid(
			authenticatedUser.firebaseUid,
		);
		if (existingUser) {
			console.warn(
				`[UserService] User already exists for FirebaseUID (${authenticatedUser.firebaseUid})`,
			);
			return null;
		}
		// トークン取得
		const userTokenRecord = await deps.userRepo.findByFirebaseUid(
			authenticatedUser.firebaseUid,
		);
		if (!userTokenRecord?.encryptedGitHubAccessToken) {
			console.error(
				"[UserService] No encrypted GitHub access token found for user",
				authenticatedUser.firebaseUid,
			);
			throw new HTTPException(403, {
				message: "GitHub access token is not registered.",
			});
		}
		let githubAccessToken: string;
		try {
			githubAccessToken = decrypt(userTokenRecord.encryptedGitHubAccessToken);
		} catch (e) {
			console.error("[UserService] Failed to decrypt GitHub access token", e);
			throw new HTTPException(403, {
				message: "Failed to decrypt GitHub access token",
			});
		}

		// 2. GitHub APIから正規ユーザー情報を取得
		let githubUserInfo: {
			id: number;
			login: string;
			name: string | null;
			email: string | null;
			avatar_url: string | null;
		};
		try {
			githubUserInfo =
				await deps.githubPort.getAuthenticatedUserInfo(githubAccessToken);
		} catch (e) {
			console.error("[UserService] Failed to fetch GitHub user info", e);
			throw new HTTPException(500, {
				message: "Failed to fetch GitHub user info",
			});
		}

		// 3. Userオブジェクトを生成
		const now = new Date().toISOString();
		const userToSave: import("../domain/user").User = {
			id: randomUUID(),
			githubUserId: githubUserInfo.id,
			githubUsername: githubUserInfo.login,
			language: language ?? "ja",
			firebaseUid: authenticatedUser.firebaseUid,
			githubDisplayName: githubUserInfo.name,
			email: githubUserInfo.email,
			avatarUrl: githubUserInfo.avatar_url,
			createdAt: now,
			updatedAt: now,
			encryptedGitHubAccessToken: userTokenRecord.encryptedGitHubAccessToken,
		};
		const validationResult = UserSchema.safeParse(userToSave);
		if (!validationResult.success) {
			console.error(
				"[UserService] New user data validation failed before saving:",
				validationResult.error.flatten().fieldErrors,
			);
			throw new HTTPException(422, {
				message: "User data validation failed",
				cause: validationResult.error,
			});
		}
		const validatedNewUser = validationResult.data;
		const savedUser = await deps.userRepo.save(validatedNewUser);
		if (!savedUser) {
			console.error(
				"[UserService] Failed to save new user to DB for ID:",
				authenticatedUser.id,
			);
			throw new HTTPException(500, {
				message: "Failed to save new user to DB",
			});
		}
		console.log("[UserService] Successfully saved new user to DB:", savedUser);
		return savedUser;
	};

	const createSession = async (
		authenticatedUser: AuthenticatedUser | undefined,
	): Promise<AuthSession | null> => {
		if (!authenticatedUser) {
			console.error(
				"[UserService] createSession called without authenticatedUser.",
			);
			return null;
		}
		const now = new Date().toISOString();
		const expires = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(); // 24h後
		const session: AuthSession = {
			id: randomUUID(),
			userId: authenticatedUser.id,
			firebaseUid: authenticatedUser.firebaseUid,
			tokenHash: "dummy-token-hash", // 本来はトークンのSHA-256
			expiresAt: expires,
			createdAt: now,
			revokedAt: undefined,
		};
		return session;
	};

	const registerFavoriteRepository = async (
		authenticatedUser: AuthenticatedUser | undefined,
		owner: string,
		repo: string,
	): Promise<{ alreadyExists: boolean; favorite: FavoriteRepository }> => {
		if (!authenticatedUser) {
			throw new HTTPException(403, { message: "User is not authenticated." });
		}
		const user = await deps.userRepo.findById(authenticatedUser.id);
		if (!user?.encryptedGitHubAccessToken) {
			throw new HTTPException(403, {
				message:
					"GitHub access token is not registered. Please connect your GitHub account.",
			});
		}
		const accessToken = decrypt(user.encryptedGitHubAccessToken);
		let repoInfo: import("../domain/repository.js").RepositoryInfo;
		try {
			repoInfo = await deps.githubPort.getRepositoryByOwnerAndRepo(
				accessToken,
				owner,
				repo,
			);
		} catch (e: unknown) {
			if (e instanceof Error && e.message === "GITHUB_REPO_NOT_FOUND") {
				throw new HTTPException(404, {
					message: "GitHub repository not found",
				});
			}
			throw new HTTPException(500, {
				message: "Failed to fetch repository info",
			});
		}
		const existing =
			await deps.favoriteRepositoryRepo.findByUserIdAndGithubRepoId(
				authenticatedUser.id,
				repoInfo.githubRepoId,
			);
		if (existing) {
			return { alreadyExists: true, favorite: existing };
		}
		const now = new Date().toISOString();
		const favorite: FavoriteRepository = {
			id: randomUUID(),
			userId: authenticatedUser.id,
			githubRepoId: repoInfo.githubRepoId,
			repositoryFullName: repoInfo.repositoryFullName,
			owner: repoInfo.owner,
			repo: repoInfo.repo,
			registeredAt: now,
		};
		const validation = favoriteRepositorySchema.safeParse(favorite);
		if (!validation.success) {
			throw new HTTPException(422, {
				message: "FavoriteRepository validation failed",
				cause: validation.error,
			});
		}
		const saved = await deps.favoriteRepositoryRepo.save(favorite);
		return { alreadyExists: false, favorite: saved };
	};

	const saveGitHubToken = async (
		userId: string,
		token: string,
	): Promise<{ success: boolean }> => {
		try {
			const encryptedToken = encrypt(token);
			await deps.userRepo.update(userId, {
				encryptedGitHubAccessToken: encryptedToken,
			});
			return { success: true };
		} catch (error) {
			console.error(
				`[UserService] Failed to save GitHub token for user ${userId}`,
				error,
			);
			return { success: false };
		}
	};

	const getFavoriteRepositories = async (
		userId: string,
		options: { limit: number; offset: number },
	): Promise<{ favorites: FavoriteRepository[]; total: number }> => {
		return deps.favoriteRepositoryRepo.findByUserId(userId, options);
	};

	const deleteFavoriteRepository = async (
		userId: string,
		favoriteId: string,
	): Promise<{ success: boolean }> => {
		const favorite = await deps.favoriteRepositoryRepo.findById(favoriteId);
		if (!favorite) {
			throw new HTTPException(404, {
				message: "Favorite repository not found",
			});
		}
		if (favorite.userId !== userId) {
			throw new HTTPException(403, {
				message: "Forbidden to delete this favorite repository",
			});
		}
		const deleted = await deps.favoriteRepositoryRepo.delete(favoriteId);
		if (!deleted) {
			throw new HTTPException(404, {
				message: "Favorite repository not found",
			});
		}
		return { success: true };
	};

	return {
		getCurrentUser,
		logoutUser,
		createUser,
		createSession,
		registerFavoriteRepository,
		saveGitHubToken,
		getFavoriteRepositories,
		deleteFavoriteRepository,
	};
};

export type UserService = ReturnType<typeof createUserService>;
