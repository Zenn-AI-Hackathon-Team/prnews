import { z } from "zod";

export const pullRequestSchema = z.object({
	prNumber: z
		.number()
		.int("PR 番号は整数で入力してください")
		.positive("PR 番号は正の数で入力してください"),
	githubPrUrl: z.string().url("正しい URL 形式で入力してください"),
	title: z.string(),
	body: z.string().nullable(),
	diff: z.string(),
	authorLogin: z.string(),
	githubPrCreatedAt: z.string().datetime("正しい日時形式で入力してください"),
	comments: z.array(
		z.object({
			author: z.string(),
			body: z.string(),
			createdAt: z.string(),
		}),
	),
	owner: z.string().describe("リポジトリオーナー"),
	repo: z.string().describe("リポジトリ名"),
});
export type PullRequest = z.infer<typeof pullRequestSchema>;
