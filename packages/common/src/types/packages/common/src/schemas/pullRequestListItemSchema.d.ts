import { z } from "zod";
export declare const pullRequestListItemSchema: z.ZodObject<{
    prNumber: z.ZodNumber;
    title: z.ZodString;
    authorLogin: z.ZodString;
    githubPrUrl: z.ZodString;
    state: z.ZodString;
    createdAt: z.ZodString;
    articleExists: z.ZodBoolean;
    owner: z.ZodString;
    repo: z.ZodString;
}, "strip", z.ZodTypeAny, {
    title: string;
    prNumber: number;
    githubPrUrl: string;
    authorLogin: string;
    createdAt: string;
    owner: string;
    repo: string;
    state: string;
    articleExists: boolean;
}, {
    title: string;
    prNumber: number;
    githubPrUrl: string;
    authorLogin: string;
    createdAt: string;
    owner: string;
    repo: string;
    state: string;
    articleExists: boolean;
}>;
export type PullRequestListItem = z.infer<typeof pullRequestListItemSchema>;
