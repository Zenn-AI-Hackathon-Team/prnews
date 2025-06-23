import { z } from "zod";
export declare const issueArticleSchema: z.ZodObject<{
    issueNumber: z.ZodNumber;
    owner: z.ZodString;
    repo: z.ZodString;
    githubIssueUrl: z.ZodString;
    title: z.ZodString;
    author: z.ZodObject<{
        login: z.ZodString;
        avatar_url: z.ZodString;
        html_url: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        login: string;
        avatar_url: string;
        html_url: string;
    }, {
        login: string;
        avatar_url: string;
        html_url: string;
    }>;
    state: z.ZodEnum<["open", "closed"]>;
    labels: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        color: z.ZodString;
        description: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        description: string | null;
        name: string;
        color: string;
    }, {
        description: string | null;
        name: string;
        color: string;
    }>, "many">;
    comments: z.ZodArray<z.ZodObject<{
        author: z.ZodNullable<z.ZodObject<{
            login: z.ZodString;
            avatar_url: z.ZodString;
            html_url: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            login: string;
            avatar_url: string;
            html_url: string;
        }, {
            login: string;
            avatar_url: string;
            html_url: string;
        }>>;
        body: z.ZodString;
        createdAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        body: string;
        author: {
            login: string;
            avatar_url: string;
            html_url: string;
        } | null;
        createdAt: string;
    }, {
        body: string;
        author: {
            login: string;
            avatar_url: string;
            html_url: string;
        } | null;
        createdAt: string;
    }>, "many">;
    githubIssueCreatedAt: z.ZodString;
    githubIssueUpdatedAt: z.ZodString;
    body: z.ZodNullable<z.ZodString>;
    assignee: z.ZodNullable<z.ZodObject<{
        login: z.ZodString;
        avatar_url: z.ZodString;
        html_url: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        login: string;
        avatar_url: string;
        html_url: string;
    }, {
        login: string;
        avatar_url: string;
        html_url: string;
    }>>;
    assignees: z.ZodNullable<z.ZodArray<z.ZodObject<{
        login: z.ZodString;
        avatar_url: z.ZodString;
        html_url: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        login: string;
        avatar_url: string;
        html_url: string;
    }, {
        login: string;
        avatar_url: string;
        html_url: string;
    }>, "many">>;
    milestone: z.ZodNullable<z.ZodObject<{
        title: z.ZodString;
        state: z.ZodEnum<["open", "closed"]>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        state: "open" | "closed";
    }, {
        title: string;
        state: "open" | "closed";
    }>>;
} & {
    id: z.ZodString;
    totalLikeCount: z.ZodDefault<z.ZodNumber>;
    contents: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
        aiGeneratedTitle: z.ZodString;
        problemSummary: z.ZodString;
        solutionSuggestion: z.ZodOptional<z.ZodString>;
        discussionPoints: z.ZodOptional<z.ZodArray<z.ZodObject<{
            author: z.ZodString;
            summary: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            author: string;
            summary: string;
        }, {
            author: string;
            summary: string;
        }>, "many">>;
        summaryGeneratedAt: z.ZodString;
        likeCount: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        aiGeneratedTitle: string;
        summaryGeneratedAt: string;
        likeCount: number;
        problemSummary: string;
        solutionSuggestion?: string | undefined;
        discussionPoints?: {
            author: string;
            summary: string;
        }[] | undefined;
    }, {
        aiGeneratedTitle: string;
        summaryGeneratedAt: string;
        problemSummary: string;
        likeCount?: number | undefined;
        solutionSuggestion?: string | undefined;
        discussionPoints?: {
            author: string;
            summary: string;
        }[] | undefined;
    }>>>;
    createdAt: z.ZodOptional<z.ZodString>;
    updatedAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    title: string;
    body: string | null;
    comments: {
        body: string;
        author: {
            login: string;
            avatar_url: string;
            html_url: string;
        } | null;
        createdAt: string;
    }[];
    author: {
        login: string;
        avatar_url: string;
        html_url: string;
    };
    owner: string;
    repo: string;
    id: string;
    totalLikeCount: number;
    state: "open" | "closed";
    issueNumber: number;
    githubIssueUrl: string;
    labels: {
        description: string | null;
        name: string;
        color: string;
    }[];
    githubIssueCreatedAt: string;
    githubIssueUpdatedAt: string;
    assignee: {
        login: string;
        avatar_url: string;
        html_url: string;
    } | null;
    assignees: {
        login: string;
        avatar_url: string;
        html_url: string;
    }[] | null;
    milestone: {
        title: string;
        state: "open" | "closed";
    } | null;
    createdAt?: string | undefined;
    contents?: Record<string, {
        aiGeneratedTitle: string;
        summaryGeneratedAt: string;
        likeCount: number;
        problemSummary: string;
        solutionSuggestion?: string | undefined;
        discussionPoints?: {
            author: string;
            summary: string;
        }[] | undefined;
    }> | undefined;
    updatedAt?: string | undefined;
}, {
    title: string;
    body: string | null;
    comments: {
        body: string;
        author: {
            login: string;
            avatar_url: string;
            html_url: string;
        } | null;
        createdAt: string;
    }[];
    author: {
        login: string;
        avatar_url: string;
        html_url: string;
    };
    owner: string;
    repo: string;
    id: string;
    state: "open" | "closed";
    issueNumber: number;
    githubIssueUrl: string;
    labels: {
        description: string | null;
        name: string;
        color: string;
    }[];
    githubIssueCreatedAt: string;
    githubIssueUpdatedAt: string;
    assignee: {
        login: string;
        avatar_url: string;
        html_url: string;
    } | null;
    assignees: {
        login: string;
        avatar_url: string;
        html_url: string;
    }[] | null;
    milestone: {
        title: string;
        state: "open" | "closed";
    } | null;
    createdAt?: string | undefined;
    totalLikeCount?: number | undefined;
    contents?: Record<string, {
        aiGeneratedTitle: string;
        summaryGeneratedAt: string;
        problemSummary: string;
        likeCount?: number | undefined;
        solutionSuggestion?: string | undefined;
        discussionPoints?: {
            author: string;
            summary: string;
        }[] | undefined;
    }> | undefined;
    updatedAt?: string | undefined;
}>;
export type IssueArticle = z.infer<typeof issueArticleSchema>;
