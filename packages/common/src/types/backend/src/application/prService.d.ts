import { type PullRequest as CommonPullRequest, type LikedArticleInfo, type PullRequestArticle as PullRequestArticleType } from "@prnews/common";
import type { ArticleLikeRepoPort } from "../ports/articleLikeRepoPort.js";
import type { GeminiPort } from "../ports/geminiPort.js";
import type { GithubPort } from "../ports/githubPort.js";
import type { PrRepoPort } from "../ports/prRepoPort.js";
import type { UserRepoPort } from "../ports/userRepoPort";
export declare const createPrService: (deps: {
    github: GithubPort;
    gemini: GeminiPort;
    prRepo: PrRepoPort;
    articleLikeRepo: ArticleLikeRepoPort;
    userRepo: UserRepoPort;
}) => {
    ingestPr: (userId: string, owner: string, repo: string, number: number) => Promise<{
        prNumber: number;
        owner: string;
        repo: string;
        githubPrUrl: string;
        title: string;
        body: string | null;
        diff: string;
        authorLogin: string;
        githubPrCreatedAt: string;
        comments: import("../domain/pullRequest").Comment[];
    }>;
    generateArticle: (owner: string, repo: string, number: number) => Promise<{
        id: string;
        prNumber: number;
        repository: string;
        title: string;
        diff: string;
        authorLogin: string;
        createdAt: string;
        githubPrUrl: string;
        body: string | null;
        githubPrCreatedAt: string;
        updatedAt: string;
        comments: import("../domain/pullRequest").Comment[];
        owner: string;
        repo: string;
        contents: {
            ja: {
                aiGeneratedTitle: string;
                backgroundAndPurpose: string | undefined;
                mainChanges: {
                    changeTypes: ("FEAT" | "FIX" | "REFACTOR" | "DOCS" | "TEST" | "PERF" | "BUILD" | "CHORE")[];
                    description: string;
                    fileName: string;
                }[];
                notablePoints: {
                    categories: ("PERF" | "TECH" | "RISK" | "UX" | "SECURITY")[];
                    point: string;
                }[];
                summaryGeneratedAt: string;
                likeCount: number;
            };
        };
    }>;
    getPullRequest: (owner: string, repo: string, pullNumber: number) => Promise<CommonPullRequest>;
    getArticle: (prId: string) => Promise<PullRequestArticleType>;
    likeArticle: (userId: string, articleId: string, langCode: string) => Promise<{
        alreadyLiked: boolean;
        likeCount: number;
        message: string;
    }>;
    unlikeArticle: (userId: string, articleId: string, langCode: string) => Promise<{
        likeCount: number;
    }>;
    getLikedArticles: (userId: string, options?: {
        lang?: string;
        limit?: number;
        offset?: number;
        sort?: "likedAt_desc" | "likedAt_asc";
    }) => Promise<{
        data: LikedArticleInfo[];
        totalItems: number;
    }>;
    getPullRequestListForRepo: (userId: string, owner: string, repo: string, query: {
        state?: "open" | "closed" | "all";
        per_page?: number;
        page?: number;
    }) => Promise<{
        prNumber: number;
        title: string;
        authorLogin: string;
        githubPrUrl: string;
        state: string;
        createdAt: string;
        articleExists: boolean;
        owner: string;
        repo: string;
    }[]>;
};
export type PrService = ReturnType<typeof createPrService>;
