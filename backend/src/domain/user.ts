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
