import type { User } from "../domain/user";

export interface UserRepoPort {
	save: (user: User) => Promise<User | null>;
	findById: (id: string) => Promise<User | null>;
	findByGithubUserId: (githubUserId: number) => Promise<User | null>;
	findByFirebaseUid: (firebaseUid: string) => Promise<User | null>;
	update: (
		id: string,
		data: Partial<User & { encryptedGitHubAccessToken?: string }>,
	) => Promise<User | null>;
}
