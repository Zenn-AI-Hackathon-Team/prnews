import type { PR } from "@/features/routes/pr_list/components/PRCard";
import PRList from "@/features/routes/pr_list/components/PRList";

import { client } from "@/lib/hono";
import type { RankedArticleInfo } from "@prnews/common";

// RankedArticleInfoはすでにPR型と同じ構造なので、型アサーションのみ必要
const convertToPR = (article: RankedArticleInfo): PR => {
	return article as PR;
};

const page = async () => {
	const weeklyRes = await client.ranking.articles.likes.$get({
		query: {
			limit: "10",
			offset: "0",
			period: "weekly",
			language: "ja",
		},
	});

	const goodAllRes = await client.ranking.articles.likes.$get({
		query: {
			limit: "10",
			offset: "0",
			period: "all",
			language: "ja",
		},
	});

	// --- エラーハンドリングはここに集約 ---
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
	console.log(weeklyRankingData);

	const goodAllResponseData = await goodAllRes.json();
	const goodAllRankingData: RankedArticleInfo[] = goodAllResponseData.data.data;
	console.log(goodAllRankingData);

	// RankedArticleInfoをPR型に変換
	const weeklyPRs: PR[] = weeklyRankingData.map((article) =>
		convertToPR(article),
	);
	const goodPRs: PR[] = goodAllRankingData.map((article) =>
		convertToPR(article),
	);

	return (
		<div>
			<PRList weeklyPRs={weeklyPRs} goodPRs={goodPRs} />
		</div>
	);
};

export default page;
