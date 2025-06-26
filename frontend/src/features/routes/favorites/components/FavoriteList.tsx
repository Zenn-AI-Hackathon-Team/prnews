import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FavoriteRepository } from "@prnews/common";
import { Heart } from "lucide-react";
import type React from "react";
import FavoriteItemCard from "./FavoriteCard";

type FavoriteListProps = {
	favorites: FavoriteRepository[];
	isLoading: boolean;
	error: string | null;
	onDelete: (owner: string, repo: string) => void;
};

const FavoriteList: React.FC<FavoriteListProps> = ({
	favorites,
	isLoading,
	error,
	onDelete,
}) => {
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
				) : favorites.length === 0 ? (
					<div className="text-center text-muted-foreground py-8">
						<Heart className="mx-auto mb-2 h-8 w-8 text-red-400 opacity-60" />
						<div>お気に入りはありません</div>
					</div>
				) : (
					favorites.map((fav) => (
						<FavoriteItemCard
							key={fav.id}
							fav={fav}
							onDelete={() => onDelete(fav.owner, fav.repo)}
						/>
					))
				)}
			</CardContent>
		</Card>
	);
};

export default FavoriteList;
