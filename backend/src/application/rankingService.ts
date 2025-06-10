import {
	type RankedArticleInfo,
	rankedArticleInfoSchema,
} from "@prnews/common";
import type {
	ArticleContent,
	PullRequestArticle,
} from "../domain/pullRequestArticle";
import type { ArticleLikeRepoPort } from "../ports/articleLikeRepoPort";
import type { PrRepoPort } from "../ports/prRepoPort";

export const createRankingService = (deps: {
	prRepo: PrRepoPort;
	articleLikeRepo: ArticleLikeRepoPort;
}) => {
	/**
	 * いいね数ランキングを取得
	 * @param options period, language, limit, offset
	 */
	const getArticleLikeRanking = async (
		options: {
			period?: "weekly" | "monthly" | "all";
			language?: string;
			limit?: number;
			offset?: number;
		} = {},
	): Promise<{ data: RankedArticleInfo[]; totalItems: number }> => {
		// Firestoreクエリでランキング取得
		const articles: PullRequestArticle[] =
			await deps.prRepo.getRanking(options);
		const language = options.language ?? "all";
		const offset = options.offset ?? 0;
		// RankedArticleInfo配列に整形
		const data: RankedArticleInfo[] = articles
			.map((a, i) => {
				const lang =
					language === "all"
						? a.contents
							? Object.keys(a.contents)[0]
							: "ja"
						: language;
				const c: ArticleContent | undefined = a.contents?.[lang];
				try {
					return rankedArticleInfoSchema.parse({
						rank: offset + i + 1,
						articleId: a.id,
						languageCode: lang,
						aiGeneratedTitle: c?.aiGeneratedTitle || "",
						repositoryFullName:
							(a as { repositoryFullName?: string }).repositoryFullName ||
							a.repository,
						prNumber: a.prNumber,
						likeCount:
							language === "all" ? (a.totalLikeCount ?? 0) : c?.likeCount || 0,
					});
				} catch (e) {
					console.error(
						"[RankingService] rankedArticleInfoSchema.parse error",
						e,
						{
							a,
							lang,
							c,
						},
					);
					return undefined;
				}
			})
			.filter((v): v is RankedArticleInfo => v !== undefined);
		return { data, totalItems: articles.length };
	};

	return { getArticleLikeRanking };
};

export type RankingService = ReturnType<typeof createRankingService>;
