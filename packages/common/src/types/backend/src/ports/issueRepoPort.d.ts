import type { IssueArticle } from "@prnews/common";
import type { Transaction } from "firebase-admin/firestore";
export interface IssueRepoPort {
    saveArticle(article: IssueArticle): Promise<void>;
    findByNumber(owner: string, repo: string, issueNumber: number): Promise<IssueArticle | null>;
    findArticleById(articleId: string, tx?: Transaction): Promise<IssueArticle | null>;
    checkArticlesExist(owner: string, repo: string, issueNumbers: number[]): Promise<number[]>;
}
