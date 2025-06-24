import type { User } from "@prnews/common";

export const userRepoMemory = () => {
	const usersById = new Map<string, User>();
	const usersByGithubId = new Map<number, User>();

	return;
};
