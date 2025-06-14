import { z } from "zod";

export const issueListItemSchema = z.object({
	issueNumber: z.number().describe("Issue番号"),
	title: z.string().describe("Issueのタイトル"),
	authorLogin: z.string().describe("作成者のGitHubユーザー名"),
	githubIssueUrl: z.string().url().describe("GitHub上のIssueへのURL"),
	state: z.string().describe("Issueの状態 (e.g., 'open', 'closed')"),
	createdAt: z.string().datetime().describe("Issue作成日時"),
	articleExists: z.boolean().describe("解説記事がPR News内に存在するかどうか"),
});

export type IssueListItem = z.infer<typeof issueListItemSchema>;
