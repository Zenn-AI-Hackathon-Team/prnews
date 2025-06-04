import { randomUUID } from "node:crypto";
import {
	type AuthSession,
	userSchema as UserSchema,
	type User as UserSchemaType,
} from "@prnews/common";
import {
	createUser,
	createUserObjectFromAuthenticatedUser,
} from "../domain/user";
import type { AuthSessionRepoPort } from "../ports/authSessionRepoPort";
import type { UserRepoPort } from "../ports/userRepoPort";
import type { AuthenticatedUser } from "../presentation/middlewares/authMiddleware";

export const createUserService = (deps: {
	userRepo: UserRepoPort;
	authSessionRepo: AuthSessionRepoPort;
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
		// 既に存在する場合はnull返す（409用）
		const existing = await deps.userRepo.findById(authenticatedUser.id);
		if (existing) {
			console.warn(
				`[UserService] User already exists for ID (${authenticatedUser.id})`,
			);
			return null;
		}
		const newUserInputData = createUserObjectFromAuthenticatedUser(
			authenticatedUser,
			language ?? "ja",
		);
		const userToSave: UserSchemaType = {
			id: authenticatedUser.id,
			...newUserInputData,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			githubDisplayName: null,
			email: null,
			avatarUrl: null,
		};
		const validationResult = UserSchema.safeParse(userToSave);
		if (!validationResult.success) {
			console.error(
				"[UserService] New user data validation failed before saving:",
				validationResult.error.flatten().fieldErrors,
			);
			return null;
		}
		const validatedNewUser = validationResult.data;
		const savedUser = await deps.userRepo.save(validatedNewUser);
		if (!savedUser) {
			console.error(
				"[UserService] Failed to save new user to DB for ID:",
				authenticatedUser.id,
			);
			return null;
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
			id: "", // save時に採番
			userId: authenticatedUser.id,
			firebaseUid: authenticatedUser.firebaseUid,
			tokenHash: "dummy-token-hash", // 本来はトークンのSHA-256
			expiresAt: expires,
			createdAt: now,
			revokedAt: undefined,
		};
		const saved = await deps.authSessionRepo.save(session);
		if (!saved) {
			console.error("[UserService] Failed to save new session");
			return null;
		}
		console.log("[UserService] Created new session:", saved);
		return saved;
	};

	return {
		getCurrentUser,
		logoutUser,
		createUser,
		createSession,
	};
};

export type UserService = ReturnType<typeof createUserService>;
