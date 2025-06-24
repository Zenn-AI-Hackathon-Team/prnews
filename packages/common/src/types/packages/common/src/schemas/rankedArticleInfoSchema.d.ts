import { z } from "zod";
export declare const rankedArticleInfoSchema: z.ZodObject<{
    rank: z.ZodNumber;
    articleId: z.ZodString;
    languageCode: z.ZodString;
    aiGeneratedTitle: z.ZodString;
    owner: z.ZodString;
    repo: z.ZodString;
    prNumber: z.ZodNumber;
    likeCount: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    prNumber: number;
    owner: string;
    repo: string;
    aiGeneratedTitle: string;
    likeCount: number;
    articleId: string;
    languageCode: string;
    rank: number;
}, {
    prNumber: number;
    owner: string;
    repo: string;
    aiGeneratedTitle: string;
    likeCount: number;
    articleId: string;
    languageCode: string;
    rank: number;
}>;
export type RankedArticleInfo = z.infer<typeof rankedArticleInfoSchema>;
export declare const paginationSchema: z.ZodObject<{
    totalItems: z.ZodNumber;
    limit: z.ZodNumber;
    offset: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    totalItems: number;
    limit: number;
    offset: number;
}, {
    totalItems: number;
    limit: number;
    offset: number;
}>;
export type Pagination = z.infer<typeof paginationSchema>;
