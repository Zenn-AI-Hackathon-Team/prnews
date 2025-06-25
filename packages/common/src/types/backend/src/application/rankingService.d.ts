import { type RankedArticleInfo } from "@prnews/common";
import type { ArticleLikeRepoPort } from "../ports/articleLikeRepoPort";
import type { PrRepoPort } from "../ports/prRepoPort";
export declare const createRankingService: (deps: {
    prRepo: PrRepoPort;
    articleLikeRepo: ArticleLikeRepoPort;
}) => {
    getArticleLikeRanking: (options?: {
        period?: "weekly" | "monthly" | "all";
        language?: string;
        limit?: number;
        offset?: number;
    }) => Promise<{
        data: RankedArticleInfo[];
        totalItems: number;
    }>;
};
export type RankingService = ReturnType<typeof createRankingService>;
