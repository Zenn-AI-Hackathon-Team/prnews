import { z } from "zod";
export declare const likedArticleInfoSchema: z.ZodObject<{
    articleId: z.ZodString;
    languageCode: z.ZodString;
    likedAt: z.ZodString;
    aiGeneratedTitle: z.ZodString;
    owner: z.ZodString;
    repo: z.ZodString;
    prNumber: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    prNumber: number;
    owner: string;
    repo: string;
    aiGeneratedTitle: string;
    articleId: string;
    languageCode: string;
    likedAt: string;
}, {
    prNumber: number;
    owner: string;
    repo: string;
    aiGeneratedTitle: string;
    articleId: string;
    languageCode: string;
    likedAt: string;
}>;
export type LikedArticleInfo = z.infer<typeof likedArticleInfoSchema>;
