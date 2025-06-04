import type { AuthenticatedUser } from "../presentation/middlewares/authMiddleware";

export type User = {
	id: string;
	githubUserId: number;
	githubUsername: string;
	// 必要に応じて他のフィールドを追加
};

export const createUser = (props: Omit<User, "id">): User => ({
	id: crypto.randomUUID(),
	...props,
});

export const createUserObjectFromAuthenticatedUser = (
	authUser: AuthenticatedUser,
): Omit<User, "id" | "createdAt" | "updatedAt"> => {
	return {
		githubUserId:
			Number(authUser.firebaseUid.replace(/\D/g, "").slice(0, 7)) || Date.now(), // ダミー
		githubUsername: authUser.githubUsername,
		// 必要に応じて他のフィールドも追加
		// githubDisplayName, email, avatarUrl などはnullやダミーでOK
	};
};
