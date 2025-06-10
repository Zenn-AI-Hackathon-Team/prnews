// HonoのRPCのサンプルページ
// SSR(サーバーサイドレンダリング)バージョン

import { client } from "@/lib/hono";
import type { RankedArticleInfo } from "@prnews/common";

const page = async () => {
	const res = await client.ranking.articles.likes.$get({
		query: {
			limit: "10",
			offset: "0",
			period: "all",
			language: "ja",
		},
	});

	// --- エラーハンドリングはここに集約 ---
	if (!res.ok) {
		const errorData = await res.json();

		return (
			<div className="text-red-500">
				<h2>エラー</h2>
				<p>{errorData.message}</p>
				<p>{errorData.code}</p>
			</div>
		);
	}

	// --- 成功時の処理 ---
	const responseData = await res.json();
	const rankingData: RankedArticleInfo[] = responseData.data.data;

	return (
		<div>
			<h1 className="mb-4 font-bold text-2xl">いいねランキング</h1>
			{rankingData.map((item) => (
				<div key={item.articleId} className="p-2 border-b">
					<p className="font-bold">
						{item.rank}位: {item.aiGeneratedTitle}
					</p>
					<p className="text-gray-600 text-sm">
						{item.repositoryFullName} | いいね: {item.likeCount}
					</p>
				</div>
			))}
		</div>
	);
};

export default page;
