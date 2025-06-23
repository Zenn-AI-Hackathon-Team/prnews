import type { ArticleLike } from "@prnews/common";
import type { Transaction } from "firebase-admin/firestore";

export interface ArticleLikeRepoPort {
	findByUserIdAndArticleIdAndLang(
		userId: string,
		articleId: string,
		lang: string,
		tx?: Transaction,
	): Promise<ArticleLike | null>;
	save(like: ArticleLike, tx?: Transaction): Promise<ArticleLike>;
	deleteByUserIdAndArticleIdAndLang(
		userId: string,
		articleId: string,
		lang: string,
		tx?: Transaction,
	): Promise<boolean>;
	findByUserId(userId: string): Promise<ArticleLike[]>;
}
