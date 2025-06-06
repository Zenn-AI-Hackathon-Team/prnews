import type { AuthenticatedUser } from "../presentation/middlewares/authMiddleware";

export type User = {
	id: string;
	githubUserId: number;
	githubUsername: string;
	language: string;
	firebaseUid: string;
	githubDisplayName?: string | null;
	email?: string | null;
	avatarUrl?: string | null;
	createdAt?: string;
	updatedAt?: string;
	encryptedGitHubAccessToken?: string;
};

export const createUser = (props: Omit<User, "id">): User => ({
	id: crypto.randomUUID(),
	...props,
});

export const createUserObjectFromAuthenticatedUser = (
	authUser: AuthenticatedUser,
	language = "ja",
) => {
	return {
		githubUserId:
			Number(authUser.firebaseUid.replace(/\D/g, "").slice(0, 7)) || Date.now(), // ダミー
		githubUsername: authUser.githubUsername,
		language,
		firebaseUid: authUser.firebaseUid,
		githubDisplayName: authUser.githubDisplayName,
		email: authUser.email,
		avatarUrl: authUser.avatarUrl,
	};
};
