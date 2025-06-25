import type { IssueArticle, IssueListItem } from "@prnews/common";
import type { GeminiPort } from "../ports/geminiPort";
import type { GithubPort } from "../ports/githubPort";
import type { IssueRepoPort } from "../ports/issueRepoPort";
import type { UserRepoPort } from "../ports/userRepoPort";
export declare const createIssueService: (deps: {
    github: GithubPort;
    gemini: GeminiPort;
    issueRepo: IssueRepoPort;
    userRepo: UserRepoPort;
}) => {
    ingestIssue: (userId: string, owner: string, repo: string, issueNumber: number) => Promise<IssueArticle>;
    generateIssueArticle: (owner: string, repo: string, issueNumber: number) => Promise<IssueArticle>;
    getArticle: (owner: string, repo: string, issueNumber: number) => Promise<IssueArticle>;
    getIssueListForRepo: (userId: string, owner: string, repo: string, query: {
        state?: "open" | "closed" | "all";
        per_page?: number;
        page?: number;
    }) => Promise<IssueListItem[]>;
};
export type IssueService = ReturnType<typeof createIssueService>;
