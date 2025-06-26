import { randomUUID } from "node:crypto";
import type {
	AuthSession,
	FavoriteRepository,
	User as UserSchemaType,
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
		authenticatedUser: AuthenticatedUser,
		language?: string,
	): Promise<UserSchemaType | "already_exists" | null> => {
		// 既存ユーザー取得
		const existingUser = await deps.userRepo.findByFirebaseUid(
			authenticatedUser.firebaseUid,
		);
		if (existingUser && existingUser.githubUserId > 0) {
			return "already_exists";
		}
		// 仮レコード取得
		const userWithToken = existingUser;
		if (!userWithToken?.encryptedGitHubAccessToken) {
			throw new HTTPException(400, {
				message: "GitHub token is not exchanged yet.",
			});
		}
		const accessToken = decrypt(userWithToken.encryptedGitHubAccessToken);
		const githubUserInfo =
			await deps.githubPort.getAuthenticatedUserInfo(accessToken);
		// 既存レコードをGitHub情報で上書き
		const userToUpdate = {
			githubUserId: githubUserInfo.id,
			githubUsername: githubUserInfo.login,
			language: language ?? userWithToken.language ?? "ja",
			githubDisplayName: githubUserInfo.name,
			email: githubUserInfo.email,
			avatarUrl: githubUserInfo.avatar_url,
			updatedAt: new Date().toISOString(),
		};
		const updatedUser = await deps.userRepo.update(
			userWithToken.id,
			userToUpdate,
		);
		return updatedUser;
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
		// return session;
		const savedSession = await deps.authSessionRepo.save(session);
		if (!savedSession) {
			console.error(
				`[UserService] Failed to save session for user ${authenticatedUser.id}`,
			);
			return null;
		}

		return savedSession;
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
		firebaseUid: string,
		token: string,
	): Promise<{ success: boolean }> => {
		const encryptedToken = encrypt(token);
		const existingUser = await deps.userRepo.findByFirebaseUid(firebaseUid);
		if (existingUser) {
			await deps.userRepo.update(existingUser.id, {
				encryptedGitHubAccessToken: encryptedToken,
			});
		} else {
			await deps.userRepo.save({
				id: randomUUID(),
				firebaseUid: firebaseUid,
				encryptedGitHubAccessToken: encryptedToken,
				githubUserId: 0,
				githubUsername: "",
				language: "ja",
				githubDisplayName: "",
				email: "",
				avatarUrl: "",
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			});
		}
		return { success: true };
	};

	const getFavoriteRepositories = async (
		userId: string,
		options: { limit: number; offset: number },
	): Promise<{ favorites: FavoriteRepository[]; total: number }> => {
		return deps.favoriteRepositoryRepo.findByUserId(userId, options);
	};

	const deleteFavoriteRepository = async (
		userId: string,
		owner: string,
		repo: string,
	): Promise<{ success: boolean }> => {
		// ownerとrepoからgithubRepoIdを取得
		const user = await deps.userRepo.findById(userId);
		if (!user?.encryptedGitHubAccessToken) {
			throw new HTTPException(403, {
				message: "GitHub access token is not registered.",
			});
		}
		const accessToken = decrypt(user.encryptedGitHubAccessToken);
		const repoInfo = await deps.githubPort.getRepositoryByOwnerAndRepo(
			accessToken,
			owner,
			repo,
		);

		const favorite =
			await deps.favoriteRepositoryRepo.findByUserIdAndGithubRepoId(
				userId,
				repoInfo.githubRepoId,
			);

		if (!favorite) {
			throw new HTTPException(404, {
				message: "Favorite repository not found",
			});
		}

		const deleted = await deps.favoriteRepositoryRepo.delete(
			userId,
			favorite.id,
		);

		if (!deleted) {
			throw new HTTPException(500, {
				message: "Failed to delete favorite repository.",
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
