import type { Transaction } from "firebase-admin/firestore";
import type { PullRequest } from "../domain/pullRequest.js";
import type { PullRequestArticle } from "../domain/pullRequestArticle.js";
export interface PrRepoPort {
    savePullRequest(pr: PullRequest): Promise<void>;
    saveArticle(article: PullRequestArticle): Promise<void>;
    findByNumber(owner: string, repo: string, number: number): Promise<PullRequest | null>;
    findByOwnerRepoNumber(owner: string, repo: string, prNumber: number): Promise<PullRequest | null>;
    findArticleByPrId(prId: string, tx?: Transaction): Promise<PullRequestArticle | null>;
    incrementLikeCount(prId: string, lang: string, delta: number, tx?: Transaction): Promise<void>;
    getRanking(options: {
        period?: "weekly" | "monthly" | "all";
        language?: string;
        limit?: number;
        offset?: number;
    }): Promise<PullRequestArticle[]>;
    findArticlesByIds(ids: string[]): Promise<PullRequestArticle[]>;
    executeTransaction<T>(operation: (tx: Transaction) => Promise<T>): Promise<T>;
    checkArticlesExist(owner: string, repo: string, prNumbers: number[]): Promise<number[]>;
}
