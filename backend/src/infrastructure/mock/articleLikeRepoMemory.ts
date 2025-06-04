import type { ArticleLike } from "@prnews/common";
import type { ArticleLikeRepoPort } from "../../ports/articleLikeRepoPort.js";

export const articleLikeRepoMemory = (): ArticleLikeRepoPort => {
	const store: ArticleLike[] = [];

	return {
		async findByUserIdAndArticleIdAndLang(userId, articleId, lang) {
			return (
				store.find(
					(like) =>
						like.userId === userId &&
						like.articleId === articleId &&
						like.languageCode === lang,
				) || null
			);
		},
		async save(like) {
			store.push(like);
			return like;
		},
		async deleteByUserIdAndArticleIdAndLang(userId, articleId, lang) {
			const idx = store.findIndex(
				(like) =>
					like.userId === userId &&
					like.articleId === articleId &&
					like.languageCode === lang,
			);
			if (idx !== -1) {
				store.splice(idx, 1);
				return true;
			}
			return false;
		},
		async findByUserId(userId) {
			return store.filter((like) => like.userId === userId);
		},
	};
};
