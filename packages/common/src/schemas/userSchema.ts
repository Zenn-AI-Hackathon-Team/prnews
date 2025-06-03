// packages/common/src/schemas/userSchema.ts
import { z } from "zod";

export const userSchema = z.object({
	id: z.string().uuid().describe("アプリ固有のユーザーID (UUIDなど)"),
	githubUserId: z.number().int().positive().describe("GitHubユーザーID"), //
	githubUsername: z.string().min(1).describe("GitHubユーザー名 (例: octocat)"), //
	githubDisplayName: z
		.string()
		.nullable()
		.optional()
		.describe("GitHub表示名 (例: The Octocat)"), // TODO: GitHub APIのレスポンスに合わせて、必須/任意や型を再確認する
	email: z
		.string()
		.email("正しいメールアドレス形式で入力してください")
		.describe("メールアドレス"), //
	avatarUrl: z
		.string()
		.url("正しいURL形式で入力してください")
		.nullable()
		.optional()
		.describe("プロフィール画像のURL"), // TODO: GitHub APIのレスポンスに合わせて、必須/任意や型を再確認する
	createdAt: z.string().datetime().optional().describe("ユーザー作成日時"),
	updatedAt: z.string().datetime().optional().describe("ユーザー更新日時"),
});

export type User = z.infer<typeof userSchema>;
