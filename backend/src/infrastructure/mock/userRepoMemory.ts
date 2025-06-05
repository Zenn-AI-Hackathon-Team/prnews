import type { User } from "@prnews/common";
import type { UserRepoPort } from "../../ports/userRepoPort";

export const userRepoMemory = (): UserRepoPort => {
	const usersById = new Map<string, User>();
	const usersByGithubId = new Map<number, User>();

	return {
		save: async (user) => {
			console.log(
				`[UserRepoMemory] Saving user: ${user.id}, githubUsername: ${user.githubUsername}`,
			);
			usersById.set(user.id, user);
			if (user.githubUserId) {
				usersByGithubId.set(user.githubUserId, user);
			}
			return usersById.get(user.id) || null;
		},
		findById: async (id) => {
			console.log(`[UserRepoMemory] Finding user by id: ${id}`);
			return usersById.get(id) || null;
		},
		findByGithubUserId: async (githubUserId) => {
			console.log(
				`[UserRepoMemory] Finding user by githubUserId: ${githubUserId}`,
			);
			return usersByGithubId.get(githubUserId) || null;
		},
	};
};
