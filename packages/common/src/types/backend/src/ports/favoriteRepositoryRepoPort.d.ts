import type { FavoriteRepository } from "@prnews/common";
export interface FavoriteRepositoryRepoPort {
    findByUserIdAndGithubRepoId(userId: string, githubRepoId: number): Promise<FavoriteRepository | null>;
    save(favorite: FavoriteRepository): Promise<FavoriteRepository>;
    findByUserId(userId: string, options: {
        limit: number;
        offset: number;
    }): Promise<{
        favorites: FavoriteRepository[];
        total: number;
    }>;
    delete(userId: string, favoriteId: string): Promise<boolean>;
    findById(favoriteId: string): Promise<FavoriteRepository | null>;
}
