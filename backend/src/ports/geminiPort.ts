import type {
	Issue,
	IssueArticleContent,
	PrArticleContent,
} from "@prnews/common";

export interface GeminiPort {
	summarizeDiff(diff: string): Promise<PrArticleContent>;
	summarizeIssue(issue: Issue): Promise<IssueArticleContent>;
}
