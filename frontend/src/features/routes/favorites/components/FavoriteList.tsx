"use client";

import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import type React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { userClient } from "@/lib/hono";
import type { ErrorResponse, FavoriteRepository } from "@prnews/common";

import FavoriteItemCard from "./FavoriteCard";

const FavoriteList: React.FC = () => {
	const [list, setList] = useState<FavoriteRepository[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchFavorites = async () => {
			setIsLoading(true);
			setError(null);

			try {
				const response = await userClient.users.me[
					"favorite-repositories"
				].$get({
					query: { limit: "20", offset: "0" },
				});

				if (!response.ok) {
					const errorData: ErrorResponse = await response.json();
					throw new Error(
						errorData.message || "お気に入りの取得に失敗しました",
					);
				}

				const result = await response.json();
				setList(result.data.data);
			} catch (err) {
				console.error("Failed to fetch favorites:", err);
				setError(
					err instanceof Error ? err.message : "予期せぬエラーが発生しました",
				);
			} finally {
				setIsLoading(false);
			}
		};

		fetchFavorites();
	}, []);

	const handleRemove = (id: string) => {
		setList((prev) => prev.filter((fav) => fav.id !== id));
		// TODO: ここでAPIを呼び出し、DBからも削除する処理を後で実装
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>全てのライブラリ</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{isLoading ? (
					<div className="text-center text-muted-foreground py-8">
						<p>読み込み中...</p>
					</div>
				) : error ? (
					<div className="text-center text-red-500 py-8">
						<p>エラー: {error}</p>
					</div>
				) : list.length === 0 ? (
					<div className="text-center text-muted-foreground py-8">
						<Heart className="mx-auto mb-2 h-8 w-8 text-red-400 opacity-60" />
						<div>お気に入りはありません</div>
					</div>
				) : (
					list.map((fav) => (
						<FavoriteItemCard key={fav.id} fav={fav} onRemove={handleRemove} />
					))
				)}
			</CardContent>
		</Card>
	);
};

export default FavoriteList;
