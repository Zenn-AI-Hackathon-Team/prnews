import type { IssueArticle } from "@prnews/common";
import type { Transaction } from "firebase-admin/firestore";

export interface IssueRepoPort {
	saveArticle(article: IssueArticle): Promise<void>;

	findByNumber(
		owner: string,
		repo: string,
		issueNumber: number,
	): Promise<IssueArticle | null>;

	findArticleById(
		articleId: string,
		tx?: Transaction,
	): Promise<IssueArticle | null>;

	// 今後、いいね機能などのために他のメソッドを追加する可能性があります
}
