import { z } from "zod";
export declare const pullRequestSchema: z.ZodObject<{
    prNumber: z.ZodNumber;
    githubPrUrl: z.ZodString;
    title: z.ZodString;
    body: z.ZodNullable<z.ZodString>;
    diff: z.ZodString;
    authorLogin: z.ZodString;
    githubPrCreatedAt: z.ZodString;
    comments: z.ZodArray<z.ZodObject<{
        author: z.ZodString;
        body: z.ZodString;
        createdAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        body: string;
        author: string;
        createdAt: string;
    }, {
        body: string;
        author: string;
        createdAt: string;
    }>, "many">;
    owner: z.ZodString;
    repo: z.ZodString;
}, "strip", z.ZodTypeAny, {
    title: string;
    prNumber: number;
    githubPrUrl: string;
    body: string | null;
    diff: string;
    authorLogin: string;
    githubPrCreatedAt: string;
    comments: {
        body: string;
        author: string;
        createdAt: string;
    }[];
    owner: string;
    repo: string;
}, {
    title: string;
    prNumber: number;
    githubPrUrl: string;
    body: string | null;
    diff: string;
    authorLogin: string;
    githubPrCreatedAt: string;
    comments: {
        body: string;
        author: string;
        createdAt: string;
    }[];
    owner: string;
    repo: string;
}>;
export type PullRequest = z.infer<typeof pullRequestSchema>;
