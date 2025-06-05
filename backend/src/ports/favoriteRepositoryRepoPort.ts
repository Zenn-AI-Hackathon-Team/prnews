import type { FavoriteRepository } from "@prnews/common";

export interface FavoriteRepositoryRepoPort {
	findByUserIdAndGithubRepoId(
		userId: string,
		githubRepoId: number,
	): Promise<FavoriteRepository | null>;
	save(favorite: FavoriteRepository): Promise<FavoriteRepository>;
}
