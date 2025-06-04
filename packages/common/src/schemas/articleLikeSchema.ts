import { z } from "zod";

export const articleLikeSchema = z.object({
	id: z.string().uuid().describe("いいね自体のユニークID"),
	userId: z.string().uuid().describe("いいねしたユーザーのID"),
	articleId: z.string().uuid().describe("いいねされたPullRequestArticleのID"),
	languageCode: z
		.string()
		.length(2)
		.describe("いいねされた記事の言語コード (例: ja, en)"),
	likedAt: z.string().datetime().describe("いいねした日時"),
});

export type ArticleLike = z.infer<typeof articleLikeSchema>;
