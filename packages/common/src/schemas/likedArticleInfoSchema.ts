import { z } from "zod";

export const likedArticleInfoSchema = z.object({
	articleId: z.string().uuid().describe("PullRequestArticleのID"),
	languageCode: z.string().length(2).describe("いいねされた記事の言語コード"),
	likedAt: z.string().datetime().describe("いいねした日時"),
	aiGeneratedTitle: z.string().describe("AIによって生成された記事タイトル"),
	repositoryFullName: z
		.string()
		.describe("リポジトリのフルネーム (owner/repo)"),
	prNumber: z.number().int().positive().describe("Pull Requestの番号"),
	// articleUrl: z.string().url().optional().describe("記事詳細ページへのURL (フロントエンドで生成する場合や、固定のパスがある場合)"),
});

export type LikedArticleInfo = z.infer<typeof likedArticleInfoSchema>;
