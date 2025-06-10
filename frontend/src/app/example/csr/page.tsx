"use client";

// HonoのRPCのサンプルページ
// CSR(クライアントサイドレンダリング)バージョン

import { client } from "@/lib/apiClient";
import type { RankedArticleInfo } from "@prnews/common";
import { useEffect, useState } from "react";

const page = () => {
	type ErrorResponse = {
		message: string;
		status: number;
	};

	const [ranking, setRanking] = useState<RankedArticleInfo[]>([]);
	const [error, setError] = useState<ErrorResponse | null>(null);

	useEffect(() => {
		const fetchRanking = async () => {
			const res = await client.ranking.articles.likes.$get({
				query: {
					limit: "10",
					offset: "0",
					period: "all",
					language: "ja",
				},
			});
			if (res.ok) {
				const data = await res.json();
				setRanking(data.data.data);
			} else {
				setError({
					message: res.statusText,
					status: res.status,
				});
			}
		};
		fetchRanking();
	}, []);

	// --- エラーハンドリングはここに集約 ---
	if (error) {
		return (
			<div className="text-red-500">
				<h2>エラー</h2>
				<p>{error.message}</p>
				<p>{error.status}</p>
			</div>
		);
	}

	return (
		<div>
			<h1 className="mb-4 font-bold text-2xl">いいねランキング</h1>
			{ranking.map((item) => (
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
