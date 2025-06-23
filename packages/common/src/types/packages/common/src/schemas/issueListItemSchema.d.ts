import { z } from "zod";
export declare const issueListItemSchema: z.ZodObject<{
    issueNumber: z.ZodNumber;
    title: z.ZodString;
    authorLogin: z.ZodString;
    githubIssueUrl: z.ZodString;
    state: z.ZodString;
    createdAt: z.ZodString;
    articleExists: z.ZodBoolean;
    owner: z.ZodString;
    repo: z.ZodString;
}, "strip", z.ZodTypeAny, {
    title: string;
    authorLogin: string;
    createdAt: string;
    owner: string;
    repo: string;
    state: string;
    articleExists: boolean;
    issueNumber: number;
    githubIssueUrl: string;
}, {
    title: string;
    authorLogin: string;
    createdAt: string;
    owner: string;
    repo: string;
    state: string;
    articleExists: boolean;
    issueNumber: number;
    githubIssueUrl: string;
}>;
export type IssueListItem = z.infer<typeof issueListItemSchema>;
