import type { FavoriteRepository } from "@prnews/common";
import type { FavoriteRepositoryRepoPort } from "../../ports/favoriteRepositoryRepoPort.js";

export const favoriteRepositoryRepoMemory = (): FavoriteRepositoryRepoPort => {
	const store: FavoriteRepository[] = [];

	return {
		async findByUserIdAndGithubRepoId(userId, githubRepoId) {
			return (
				store.find(
					(fav) => fav.userId === userId && fav.githubRepoId === githubRepoId,
				) || null
			);
		},
		async save(favorite) {
			store.push(favorite);
			return favorite;
		},
	};
};
