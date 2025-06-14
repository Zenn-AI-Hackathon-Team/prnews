import { z } from "zod";
import { issueSchema } from "./issueSchema";

// Issue 要約記事の言語ごとの内容
const issueArticleContentSchema = z.object({
	aiGeneratedTitle: z
		.string()
		.min(1, "AI 生成タイトルは必須です")
		.max(80, "AI 生成タイトルは80文字以内で入力してください")
		.describe("AI が生成した Issue の要約タイトル"),

	problemSummary: z
		.string()
		.describe("AI が要約した「このIssueで解決したい課題」"),

	solutionSuggestion: z
		.string()
		.optional()
		.describe("AI が提案・要約した「考えられる解決策」"),

	discussionPoints: z
		.array(
			z.object({
				author: z.string().describe("コメント投稿者"),
				summary: z.string().describe("その人のコメントの要約"),
			}),
		)
		.optional()
		.describe("AI が要約した議論の要点"),

	summaryGeneratedAt: z.string().datetime("要約生成日時"),

	likeCount: z.number().int().nonnegative().default(0),
});

export const issueArticleSchema = issueSchema.extend({
	id: z.string().uuid("記事 ID は UUID 形式で入力してください"),
	totalLikeCount: z.number().int().nonnegative().default(0),
	contents: z
		.record(z.string().length(2), issueArticleContentSchema)
		.optional(),
	createdAt: z.string().datetime().optional(),
	updatedAt: z.string().datetime().optional(),
});

export type IssueArticle = z.infer<typeof issueArticleSchema>;
