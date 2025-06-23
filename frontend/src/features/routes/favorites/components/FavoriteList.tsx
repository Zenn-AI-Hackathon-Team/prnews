"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FavoriteRepository } from "@prnews/common";
import { Heart } from "lucide-react";
import type React from "react";
import { useState } from "react";
import FavoriteItemCard from "./FavoriteCard";

type FavoriteListProps = {
	favorites: FavoriteRepository[];
};

const FavoriteList: React.FC<FavoriteListProps> = ({ favorites }) => {
	const [list, setList] = useState(favorites);

	const handleRemove = (id: string) => {
		setList((prev) => prev.filter((fav) => fav.id !== id));
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>全てのライブラリ</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{list.length === 0 ? (
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
