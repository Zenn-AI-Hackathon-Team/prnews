export type AuthSession = {
	id: string;
	userId: string;
	firebaseUid: string;
	tokenHash: string;
	expiresAt: string;
	createdAt: string;
	revokedAt?: string;
};

export const createAuthSession = (props: AuthSession): AuthSession => ({
	...props,
});
