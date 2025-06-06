import { z } from "zod";

export const userSchema = z.object({
	id: z.string().uuid("ユーザーIDは UUID 形式で入力してください"),
	firebaseUid: z.string().min(1, "Firebase UIDは必須です"),
	githubUserId: z
		.number()
		.int("GitHub ユーザーIDは整数で入力してください")
		.positive("GitHub ユーザーIDは正の数で入力してください"),
	githubUsername: z.string().min(1, "GitHub ユーザー名を入力してください"),
	// --- 以下はGitHub APIから取得できない場合があるためnullable/optional ---
	// ・GitHubユーザーによっては未設定・非公開の場合がある
	// ・アプリ側で編集不可（GitHub情報をそのまま表示）
	// ・必須にすると一部ユーザーがサインアップできないリスクがある
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
	// --- ここまで ---
	language: z
		.string()
		.length(2, "言語コードは2文字で入力してください (例: ja, en)")
		.default("ja")
		.describe("ユーザーの希望言語コード (例: ja, en)"),
	createdAt: z.string().datetime("正しい日時形式で入力してください").optional(),
	updatedAt: z.string().datetime("正しい日時形式で入力してください").optional(),
});
export type User = z.infer<typeof userSchema>;
