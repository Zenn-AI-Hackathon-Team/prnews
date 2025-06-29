import ArticleList from "@/features/routes/article_list/components/ArticleList";
import { rankingClient } from "@/lib/hono";
import type { RankedArticleInfo } from "@prnews/common";

export default async function page() {
	// ランキングデータを取得
	const weeklyRes = await rankingClient.ranking.articles.likes.$get({
		query: {
			limit: "10",
			offset: "0",
			period: "weekly",
			language: "ja",
		},
	});

	const goodAllRes = await rankingClient.ranking.articles.likes.$get({
		query: {
			limit: "10",
			offset: "0",
			period: "all",
			language: "ja",
		},
	});

	// --- ランキングのエラーハンドリング ---
	if (!weeklyRes.ok) {
		const errorData = await weeklyRes.json();

		return (
			<div className="text-red-500">
				<h2>エラー</h2>
				<p>{errorData.message}</p>
				<p>{errorData.code}</p>
			</div>
		);
	}

	if (!goodAllRes.ok) {
		const errorData = await goodAllRes.json();

		return (
			<div className="text-red-500">
				<h2>エラー</h2>
				<p>{errorData.message}</p>
				<p>{errorData.code}</p>
			</div>
		);
	}

	// --- 成功時の処理 ---
	const weeklyResponseData = await weeklyRes.json();
	const weeklyRankingData: RankedArticleInfo[] = weeklyResponseData.data.data;

	const goodAllResponseData = await goodAllRes.json();
	const goodAllRankingData: RankedArticleInfo[] = goodAllResponseData.data.data;

	return (
		<div>
			<ArticleList
				weeklyArticles={weeklyRankingData}
				goodArticles={goodAllRankingData}
			/>
		</div>
	);
}
