import type { ArticleLike } from "@prnews/common";

export interface ArticleLikeRepoPort {
	findByUserIdAndArticleIdAndLang(
		userId: string,
		articleId: string,
		lang: string,
	): Promise<ArticleLike | null>;
	save(like: ArticleLike): Promise<ArticleLike>;
	deleteByUserIdAndArticleIdAndLang(
		userId: string,
		articleId: string,
		lang: string,
	): Promise<boolean>;
	findByUserId(userId: string): Promise<ArticleLike[]>;
}
