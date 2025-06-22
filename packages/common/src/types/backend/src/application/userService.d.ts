import type { AuthSession, FavoriteRepository, User as UserSchemaType } from "@prnews/common";
import type { AuthSessionRepoPort } from "../ports/authSessionRepoPort";
import type { FavoriteRepositoryRepoPort } from "../ports/favoriteRepositoryRepoPort.js";
import type { GithubPort } from "../ports/githubPort.js";
import type { UserRepoPort } from "../ports/userRepoPort";
import type { AuthenticatedUser } from "../presentation/middlewares/authMiddleware";
export declare const createUserService: (deps: {
    userRepo: UserRepoPort;
    authSessionRepo: AuthSessionRepoPort;
    favoriteRepositoryRepo: FavoriteRepositoryRepoPort;
    githubPort: GithubPort;
}) => {
    getCurrentUser: (authenticatedUser: AuthenticatedUser | undefined) => Promise<UserSchemaType | null>;
    logoutUser: (authenticatedUser: AuthenticatedUser | undefined) => Promise<{
        success: boolean;
        message: string;
    }>;
    createUser: (authenticatedUser: AuthenticatedUser, language?: string) => Promise<UserSchemaType | "already_exists" | null>;
    createSession: (authenticatedUser: AuthenticatedUser | undefined) => Promise<AuthSession | null>;
    registerFavoriteRepository: (authenticatedUser: AuthenticatedUser | undefined, owner: string, repo: string) => Promise<{
        alreadyExists: boolean;
        favorite: FavoriteRepository;
    }>;
    saveGitHubToken: (firebaseUid: string, token: string) => Promise<{
        success: boolean;
    }>;
    getFavoriteRepositories: (userId: string, options: {
        limit: number;
        offset: number;
    }) => Promise<{
        favorites: FavoriteRepository[];
        total: number;
    }>;
    deleteFavoriteRepository: (userId: string, owner: string, repo: string) => Promise<{
        success: boolean;
    }>;
};
export type UserService = ReturnType<typeof createUserService>;
