import type { AuthenticatedUser } from "../presentation/middlewares/authMiddleware";

export type User = {
	id: string;
	githubUserId: number;
	githubUsername: string;
	language: string;
	// 必要に応じて他のフィールドを追加
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
		// 必要に応じて他のフィールドも追加
		// githubDisplayName, email, avatarUrl などはnullやダミーでOK
	};
};
