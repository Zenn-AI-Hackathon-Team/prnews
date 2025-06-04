import { z } from "zod";

export const userSchema = z.object({
	id: z.string().uuid("ユーザーIDは UUID 形式で入力してください"),
	githubUserId: z
		.number()
		.int("GitHub ユーザーIDは整数で入力してください")
		.positive("GitHub ユーザーIDは正の数で入力してください"),
	githubUsername: z.string().min(1, "GitHub ユーザー名を入力してください"),
	githubDisplayName: z.string().nullable().optional(),
	email: z
		.string()
		.email("正しいメールアドレス形式で入力してください")
		.nullable()
		.optional(),
	avatarUrl: z
		.string()
		.url("正しい URL 形式で入力してください")
		.nullable()
		.optional(),
	createdAt: z.string().datetime("正しい日時形式で入力してください").optional(),
	updatedAt: z.string().datetime("正しい日時形式で入力してください").optional(),
});
export type User = z.infer<typeof userSchema>;
