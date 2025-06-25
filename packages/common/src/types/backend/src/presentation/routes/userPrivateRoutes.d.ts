declare const userPrivateRoutes: import("@hono/zod-openapi").OpenAPIHono<{
    Variables: {
        github: import("../../ports/githubPort").GithubPort;
        gemini: import("../../ports/geminiPort").GeminiPort;
        prRepo: import("../../ports/prRepoPort").PrRepoPort;
        userRepo: import("../../ports/userRepoPort").UserRepoPort;
        authSessionRepo: import("../../ports/authSessionRepoPort").AuthSessionRepoPort;
        favoriteRepositoryRepo: import("../../ports/favoriteRepositoryRepoPort").FavoriteRepositoryRepoPort;
        articleLikeRepo: import("../../ports/articleLikeRepoPort").ArticleLikeRepoPort;
        generalService: {
            checkHealth: () => Promise<import("../../application/generalService").HealthStatus>;
        };
        prService: {
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
                comments: import("../../domain/pullRequest").Comment[];
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
                comments: import("../../domain/pullRequest").Comment[];
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
            getPullRequest: (owner: string, repo: string, pullNumber: number) => Promise<import("@prnews/common").PullRequest>;
            getArticle: (prId: string) => Promise<import("@prnews/common").PullRequestArticle>;
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
                data: import("@prnews/common").LikedArticleInfo[];
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
        userService: {
            getCurrentUser: (authenticatedUser: import("../middlewares/authMiddleware").AuthenticatedUser | undefined) => Promise<import("@prnews/common").User | null>;
            logoutUser: (authenticatedUser: import("../middlewares/authMiddleware").AuthenticatedUser | undefined) => Promise<{
                success: boolean;
                message: string;
            }>;
            createUser: (authenticatedUser: import("../middlewares/authMiddleware").AuthenticatedUser, language?: string) => Promise<import("@prnews/common").User | "already_exists" | null>;
            createSession: (authenticatedUser: import("../middlewares/authMiddleware").AuthenticatedUser | undefined) => Promise<import("@prnews/common").AuthSession | null>;
            registerFavoriteRepository: (authenticatedUser: import("../middlewares/authMiddleware").AuthenticatedUser | undefined, owner: string, repo: string) => Promise<{
                alreadyExists: boolean;
                favorite: import("@prnews/common").FavoriteRepository;
            }>;
            saveGitHubToken: (firebaseUid: string, token: string) => Promise<{
                success: boolean;
            }>;
            getFavoriteRepositories: (userId: string, options: {
                limit: number;
                offset: number;
            }) => Promise<{
                favorites: import("@prnews/common").FavoriteRepository[];
                total: number;
            }>;
            deleteFavoriteRepository: (userId: string, owner: string, repo: string) => Promise<{
                success: boolean;
            }>;
        };
        rankingService: {
            getArticleLikeRanking: (options?: {
                period?: "weekly" | "monthly" | "all";
                language?: string;
                limit?: number;
                offset?: number;
            }) => Promise<{
                data: import("@prnews/common").RankedArticleInfo[];
                totalItems: number;
            }>;
        };
        auth: import("firebase-admin/auth").Auth;
        issueRepo: import("../../ports/issueRepoPort").IssueRepoPort;
        issueService: {
            ingestIssue: (userId: string, owner: string, repo: string, issueNumber: number) => Promise<import("@prnews/common").IssueArticle>;
            generateIssueArticle: (owner: string, repo: string, issueNumber: number) => Promise<import("@prnews/common").IssueArticle>;
            getArticle: (owner: string, repo: string, issueNumber: number) => Promise<import("@prnews/common").IssueArticle>;
            getIssueListForRepo: (userId: string, owner: string, repo: string, query: {
                state?: "open" | "closed" | "all";
                per_page?: number;
                page?: number;
            }) => Promise<import("@prnews/common").IssueListItem[]>;
        };
    } & import("../middlewares/authMiddleware").AuthVariables;
}, import("hono/types").MergeSchemaPath<{
    "/auth/signup": {
        $post: {
            input: {
                json: {
                    language?: string | undefined;
                };
            };
            output: {
                code: string;
                message: string;
                details?: any;
            };
            outputFormat: "json";
            status: 500;
        } | {
            input: {
                json: {
                    language?: string | undefined;
                };
            };
            output: {
                code: string;
                message: string;
                details?: any;
            };
            outputFormat: "json";
            status: 401;
        } | {
            input: {
                json: {
                    language?: string | undefined;
                };
            };
            output: {
                success: true;
                data: {
                    id: string;
                    firebaseUid: string;
                    githubUserId: number;
                    githubUsername: string;
                    language: string;
                    createdAt?: string | undefined;
                    updatedAt?: string | undefined;
                    githubDisplayName?: string | null | undefined;
                    email?: string | null | undefined;
                    avatarUrl?: string | null | undefined;
                };
            };
            outputFormat: "json";
            status: 201;
        } | {
            input: {
                json: {
                    language?: string | undefined;
                };
            };
            output: {
                code: string;
                message: string;
                details?: any;
            };
            outputFormat: "json";
            status: 409;
        };
    };
} & {
    "/users/me": {
        $get: {
            input: {};
            output: {
                code: string;
                message: string;
                details?: any;
            };
            outputFormat: "json";
            status: 401;
        } | {
            input: {};
            output: {
                code: string;
                message: string;
                details?: any;
            };
            outputFormat: "json";
            status: 404;
        } | {
            input: {};
            output: {
                success: true;
                data: {
                    id: string;
                    firebaseUid: string;
                    githubUserId: number;
                    githubUsername: string;
                    language: string;
                    createdAt?: string | undefined;
                    updatedAt?: string | undefined;
                    githubDisplayName?: string | null | undefined;
                    email?: string | null | undefined;
                    avatarUrl?: string | null | undefined;
                };
            };
            outputFormat: "json";
            status: 200;
        };
    };
} & {
    "/auth/logout": {
        $post: {
            input: {};
            output: {
                code: string;
                message: string;
                details?: any;
            };
            outputFormat: "json";
            status: 401;
        } | {
            input: {};
            output: {
                code: string;
                message: string;
                details?: any;
            };
            outputFormat: "json";
            status: 500;
        } | {
            input: {};
            output: {
                success: true;
                data: {};
            };
            outputFormat: "json";
            status: 200;
        };
    };
} & {
    "/auth/session": {
        $post: {
            input: {};
            output: {
                code: string;
                message: string;
                details?: any;
            };
            outputFormat: "json";
            status: 401;
        } | {
            input: {};
            output: {
                code: string;
                message: string;
                details?: any;
            };
            outputFormat: "json";
            status: 500;
        } | {
            input: {};
            output: {
                success: true;
                data?: any;
            };
            outputFormat: "json";
            status: 201;
        };
    };
} & {
    "/users/me/favorite-repositories": {
        $post: {
            input: {
                json: {
                    owner: string;
                    repo: string;
                };
            };
            output: {
                code: string;
                message: string;
                details?: any;
            };
            outputFormat: "json";
            status: 404;
        } | {
            input: {
                json: {
                    owner: string;
                    repo: string;
                };
            };
            output: {
                success: true;
                data: {
                    owner: string;
                    repo: string;
                    id: string;
                    userId: string;
                    githubRepoId: number;
                    registeredAt: string;
                };
            };
            outputFormat: "json";
            status: 200;
        } | {
            input: {
                json: {
                    owner: string;
                    repo: string;
                };
            };
            output: {
                success: true;
                data: {
                    owner: string;
                    repo: string;
                    id: string;
                    userId: string;
                    githubRepoId: number;
                    registeredAt: string;
                };
            };
            outputFormat: "json";
            status: 201;
        };
    };
} & {
    "/users/me/liked-articles": {
        $get: {
            input: {
                query: {
                    sort?: "likedAt_desc" | "likedAt_asc" | undefined;
                    limit?: string | undefined;
                    offset?: string | undefined;
                    lang?: string | undefined;
                };
            };
            output: {
                code: string;
                message: string;
                details?: any;
            };
            outputFormat: "json";
            status: 401;
        } | {
            input: {
                query: {
                    sort?: "likedAt_desc" | "likedAt_asc" | undefined;
                    limit?: string | undefined;
                    offset?: string | undefined;
                    lang?: string | undefined;
                };
            };
            output: {
                success: true;
                data: {
                    data: {
                        prNumber: number;
                        owner: string;
                        repo: string;
                        aiGeneratedTitle: string;
                        articleId: string;
                        languageCode: string;
                        likedAt: string;
                    }[];
                    pagination: {
                        totalItems: number;
                        limit: number;
                        offset: number;
                    };
                };
            };
            outputFormat: "json";
            status: 200;
        };
    };
} & {
    "/users/me/favorite-repositories": {
        $get: {
            input: {
                query: {
                    limit?: string | undefined;
                    offset?: string | undefined;
                };
            };
            output: {
                code: string;
                message: string;
                details?: any;
            };
            outputFormat: "json";
            status: 401;
        } | {
            input: {
                query: {
                    limit?: string | undefined;
                    offset?: string | undefined;
                };
            };
            output: {
                success: true;
                data: {
                    data: {
                        owner: string;
                        repo: string;
                        id: string;
                        userId: string;
                        githubRepoId: number;
                        registeredAt: string;
                    }[];
                    pagination: {
                        totalItems: number;
                        limit: number;
                        offset: number;
                    };
                };
            };
            outputFormat: "json";
            status: 200;
        };
    };
} & {
    "/users/me/favorite-repositories/:owner/:repo": {
        $delete: {
            input: {
                param: {
                    owner: string;
                    repo: string;
                };
            };
            output: {
                code: string;
                message: string;
                details?: any;
            };
            outputFormat: "json";
            status: 401;
        } | {
            input: {
                param: {
                    owner: string;
                    repo: string;
                };
            };
            output: {
                code: string;
                message: string;
                details?: any;
            };
            outputFormat: "json";
            status: 404;
        } | {
            input: {
                param: {
                    owner: string;
                    repo: string;
                };
            };
            output: {
                success: true;
                data: {
                    message: string;
                };
            };
            outputFormat: "json";
            status: 200;
        };
    };
}, "/">, "/">;
export type UserPrivateRoutesType = typeof userPrivateRoutes;
export default userPrivateRoutes;
