import { z } from "zod";

// 新しいエラーレスポンスのスキーマ
export const errorResponseSchema = z.object({
	code: z.string(),
	message: z.string(),
	details: z.any().optional(),
});
export type ErrorResponse = z.infer<typeof errorResponseSchema>;

// 成功時のスキーマ（シンプル版）
export const successResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
	z.object({
		success: z.literal(true),
		data: dataSchema,
	});
