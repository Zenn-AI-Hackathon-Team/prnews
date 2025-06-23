import { z } from "zod";

export const pullRequestListItemSchema = z.object({
	prNumber: z.number().describe("PR番号"),
	title: z.string().describe("PRのタイトル"),
	authorLogin: z.string().describe("作成者のGitHubユーザー名"),
	githubPrUrl: z.string().url().describe("GitHub上のPRへのURL"),
	state: z.string().describe("PRの状態 (e.g., 'open', 'closed')"),
	createdAt: z.string().datetime().describe("PR作成日時"),
	articleExists: z.boolean().describe("解説記事がPR News内に存在するかどうか"),
	owner: z.string().describe("リポジトリのオーナー名"),
	repo: z.string().describe("リポジトリ名"),
});

export type PullRequestListItem = z.infer<typeof pullRequestListItemSchema>;
