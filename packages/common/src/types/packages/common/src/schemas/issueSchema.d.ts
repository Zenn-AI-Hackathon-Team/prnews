import { z } from "zod";
export declare const issueSchema: z.ZodObject<{
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
}>;
export type Issue = z.infer<typeof issueSchema>;
