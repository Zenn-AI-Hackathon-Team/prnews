export type AuthSession = {
	id: string;
	userId: string;
	firebaseUid: string;
	tokenHash: string;
	expiresAt: string;
	createdAt: string;
	revokedAt?: string;
};

export const createAuthSession = (
	props: Omit<AuthSession, "id">,
): AuthSession => ({
	id: crypto.randomUUID(),
	...props,
});
