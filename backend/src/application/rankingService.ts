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
		// 1. 記事一覧を取得
		const allArticles: PullRequestArticle[] =
			await deps.prRepo.findAllArticles();

		// 2. フィルタリング（言語）
		const language = options.language ?? "all";
		let filtered: PullRequestArticle[] = allArticles;
		if (language !== "all") {
			filtered = filtered.filter((a) => a.contents?.[language]);
		}

		// 3. 期間フィルタ（createdAtで判定）
		const period = options.period ?? "all";
		if (period !== "all") {
			const now = new Date();
			let from: Date;
			if (period === "weekly") {
				from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
			} else {
				from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
			}
			filtered = filtered.filter((a) => {
				if (!a.createdAt) return false;
				const created = new Date(a.createdAt);
				return created >= from;
			});
		}

		// 4. likeCountでソート
		const getLikeCount = (a: PullRequestArticle): number => {
			if (!a.contents) return 0;
			if (language === "all") {
				// 全言語合算
				return Object.values(a.contents).reduce(
					(sum, c) => sum + (c.likeCount || 0),
					0,
				);
			}
			return a.contents[language]?.likeCount || 0;
		};
		const filteredWithLike = filtered.map((a) => ({
			...a,
			_likeCount: getLikeCount(a),
		}));
		filteredWithLike.sort((a, b) => b._likeCount - a._likeCount);

		// 5. ページネーション
		const totalItems = filteredWithLike.length;
		const limit = options.limit ?? 10;
		const offset = options.offset ?? 0;
		const paged = filteredWithLike.slice(offset, offset + limit);

		// 6. RankedArticleInfo配列に整形
		const data: RankedArticleInfo[] = paged
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
						likeCount: getLikeCount(a),
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
		return { data, totalItems };
	};

	return { getArticleLikeRanking };
};
