import { z } from "zod";
export declare const favoriteRepositorySchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    githubRepoId: z.ZodNumber;
    owner: z.ZodString;
    repo: z.ZodString;
    registeredAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    owner: string;
    repo: string;
    id: string;
    userId: string;
    githubRepoId: number;
    registeredAt: string;
}, {
    owner: string;
    repo: string;
    id: string;
    userId: string;
    githubRepoId: number;
    registeredAt: string;
}>;
export type FavoriteRepository = z.infer<typeof favoriteRepositorySchema>;
