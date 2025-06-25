import { z } from "zod";
export declare const issueArticleContentSchema: z.ZodObject<{
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
}>;
export type IssueArticleContent = z.infer<typeof issueArticleContentSchema>;
