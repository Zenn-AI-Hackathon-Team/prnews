import type { User } from "@prnews/common";

export interface UserRepoPort {
	save: (user: User) => Promise<User | null>;
	findById: (id: string) => Promise<User | null>;
	findByGithubUserId: (githubUserId: number) => Promise<User | null>;
}
