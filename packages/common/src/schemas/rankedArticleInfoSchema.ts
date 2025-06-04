import { z } from "zod";

export const rankedArticleInfoSchema = z.object({
	rank: z.number().int().positive().describe("ランキング順位"),
	articleId: z.string().uuid().describe("PullRequestArticleのID"),
	languageCode: z
		.string()
		.length(2)
		.describe(
			"記事の言語コード (ランキングの絞り込みに使われた言語、または記事自体の言語)",
		),
	aiGeneratedTitle: z.string().describe("AIによって生成された記事タイトル"),
	repositoryFullName: z
		.string()
		.describe("リポジトリのフルネーム (owner/repo)"),
	prNumber: z.number().int().positive().describe("Pull Requestの番号"),
	likeCount: z.number().int().nonnegative().describe("いいね数"),
});

export type RankedArticleInfo = z.infer<typeof rankedArticleInfoSchema>;

export const paginationSchema = z.object({
	totalItems: z.number().int().nonnegative().describe("総アイテム数"),
	limit: z.number().int().positive().describe("現在のリミット値"),
	offset: z.number().int().nonnegative().describe("現在のオフセット値"),
});
export type Pagination = z.infer<typeof paginationSchema>;
