import { z } from "zod";
declare const prArticleContentSchema: z.ZodObject<{
    aiGeneratedTitle: z.ZodString;
    backgroundAndPurpose: z.ZodOptional<z.ZodString>;
    mainChanges: z.ZodOptional<z.ZodArray<z.ZodObject<{
        fileName: z.ZodString;
        changeTypes: z.ZodArray<z.ZodEnum<["FEAT", "FIX", "REFACTOR", "DOCS", "TEST", "PERF", "BUILD", "CHORE"]>, "many">;
        description: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        description: string;
        fileName: string;
        changeTypes: ("FEAT" | "FIX" | "REFACTOR" | "DOCS" | "TEST" | "PERF" | "BUILD" | "CHORE")[];
    }, {
        description: string;
        fileName: string;
        changeTypes: ("FEAT" | "FIX" | "REFACTOR" | "DOCS" | "TEST" | "PERF" | "BUILD" | "CHORE")[];
    }>, "many">>;
    notablePoints: z.ZodOptional<z.ZodArray<z.ZodObject<{
        categories: z.ZodArray<z.ZodEnum<["TECH", "RISK", "UX", "PERF", "SECURITY"]>, "many">;
        point: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        categories: ("PERF" | "TECH" | "RISK" | "UX" | "SECURITY")[];
        point: string;
    }, {
        categories: ("PERF" | "TECH" | "RISK" | "UX" | "SECURITY")[];
        point: string;
    }>, "many">>;
    summaryGeneratedAt: z.ZodString;
    likeCount: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    aiGeneratedTitle: string;
    summaryGeneratedAt: string;
    likeCount: number;
    backgroundAndPurpose?: string | undefined;
    mainChanges?: {
        description: string;
        fileName: string;
        changeTypes: ("FEAT" | "FIX" | "REFACTOR" | "DOCS" | "TEST" | "PERF" | "BUILD" | "CHORE")[];
    }[] | undefined;
    notablePoints?: {
        categories: ("PERF" | "TECH" | "RISK" | "UX" | "SECURITY")[];
        point: string;
    }[] | undefined;
}, {
    aiGeneratedTitle: string;
    summaryGeneratedAt: string;
    backgroundAndPurpose?: string | undefined;
    mainChanges?: {
        description: string;
        fileName: string;
        changeTypes: ("FEAT" | "FIX" | "REFACTOR" | "DOCS" | "TEST" | "PERF" | "BUILD" | "CHORE")[];
    }[] | undefined;
    notablePoints?: {
        categories: ("PERF" | "TECH" | "RISK" | "UX" | "SECURITY")[];
        point: string;
    }[] | undefined;
    likeCount?: number | undefined;
}>;
export type PrArticleContent = z.infer<typeof prArticleContentSchema>;
export declare const pullRequestArticleSchema: z.ZodObject<{
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
} & {
    id: z.ZodString;
    totalLikeCount: z.ZodDefault<z.ZodNumber>;
    contents: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
        aiGeneratedTitle: z.ZodString;
        backgroundAndPurpose: z.ZodOptional<z.ZodString>;
        mainChanges: z.ZodOptional<z.ZodArray<z.ZodObject<{
            fileName: z.ZodString;
            changeTypes: z.ZodArray<z.ZodEnum<["FEAT", "FIX", "REFACTOR", "DOCS", "TEST", "PERF", "BUILD", "CHORE"]>, "many">;
            description: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            description: string;
            fileName: string;
            changeTypes: ("FEAT" | "FIX" | "REFACTOR" | "DOCS" | "TEST" | "PERF" | "BUILD" | "CHORE")[];
        }, {
            description: string;
            fileName: string;
            changeTypes: ("FEAT" | "FIX" | "REFACTOR" | "DOCS" | "TEST" | "PERF" | "BUILD" | "CHORE")[];
        }>, "many">>;
        notablePoints: z.ZodOptional<z.ZodArray<z.ZodObject<{
            categories: z.ZodArray<z.ZodEnum<["TECH", "RISK", "UX", "PERF", "SECURITY"]>, "many">;
            point: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            categories: ("PERF" | "TECH" | "RISK" | "UX" | "SECURITY")[];
            point: string;
        }, {
            categories: ("PERF" | "TECH" | "RISK" | "UX" | "SECURITY")[];
            point: string;
        }>, "many">>;
        summaryGeneratedAt: z.ZodString;
        likeCount: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        aiGeneratedTitle: string;
        summaryGeneratedAt: string;
        likeCount: number;
        backgroundAndPurpose?: string | undefined;
        mainChanges?: {
            description: string;
            fileName: string;
            changeTypes: ("FEAT" | "FIX" | "REFACTOR" | "DOCS" | "TEST" | "PERF" | "BUILD" | "CHORE")[];
        }[] | undefined;
        notablePoints?: {
            categories: ("PERF" | "TECH" | "RISK" | "UX" | "SECURITY")[];
            point: string;
        }[] | undefined;
    }, {
        aiGeneratedTitle: string;
        summaryGeneratedAt: string;
        backgroundAndPurpose?: string | undefined;
        mainChanges?: {
            description: string;
            fileName: string;
            changeTypes: ("FEAT" | "FIX" | "REFACTOR" | "DOCS" | "TEST" | "PERF" | "BUILD" | "CHORE")[];
        }[] | undefined;
        notablePoints?: {
            categories: ("PERF" | "TECH" | "RISK" | "UX" | "SECURITY")[];
            point: string;
        }[] | undefined;
        likeCount?: number | undefined;
    }>>>;
    createdAt: z.ZodOptional<z.ZodString>;
    updatedAt: z.ZodOptional<z.ZodString>;
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
    id: string;
    totalLikeCount: number;
    createdAt?: string | undefined;
    contents?: Record<string, {
        aiGeneratedTitle: string;
        summaryGeneratedAt: string;
        likeCount: number;
        backgroundAndPurpose?: string | undefined;
        mainChanges?: {
            description: string;
            fileName: string;
            changeTypes: ("FEAT" | "FIX" | "REFACTOR" | "DOCS" | "TEST" | "PERF" | "BUILD" | "CHORE")[];
        }[] | undefined;
        notablePoints?: {
            categories: ("PERF" | "TECH" | "RISK" | "UX" | "SECURITY")[];
            point: string;
        }[] | undefined;
    }> | undefined;
    updatedAt?: string | undefined;
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
    id: string;
    createdAt?: string | undefined;
    totalLikeCount?: number | undefined;
    contents?: Record<string, {
        aiGeneratedTitle: string;
        summaryGeneratedAt: string;
        backgroundAndPurpose?: string | undefined;
        mainChanges?: {
            description: string;
            fileName: string;
            changeTypes: ("FEAT" | "FIX" | "REFACTOR" | "DOCS" | "TEST" | "PERF" | "BUILD" | "CHORE")[];
        }[] | undefined;
        notablePoints?: {
            categories: ("PERF" | "TECH" | "RISK" | "UX" | "SECURITY")[];
            point: string;
        }[] | undefined;
        likeCount?: number | undefined;
    }> | undefined;
    updatedAt?: string | undefined;
}>;
export type PullRequestArticle = z.infer<typeof pullRequestArticleSchema>;
export {};
