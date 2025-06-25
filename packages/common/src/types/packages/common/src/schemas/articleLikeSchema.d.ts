import { z } from "zod";
export declare const articleLikeSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    articleId: z.ZodString;
    languageCode: z.ZodString;
    likedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    userId: string;
    articleId: string;
    languageCode: string;
    likedAt: string;
}, {
    id: string;
    userId: string;
    articleId: string;
    languageCode: string;
    likedAt: string;
}>;
export type ArticleLike = z.infer<typeof articleLikeSchema>;
