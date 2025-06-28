import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { FavoriteRepository } from "@prnews/common";
import { Heart } from "lucide-react";
import type React from "react";

type Props = {
	fav: FavoriteRepository;
	onRemove: (id: string) => void;
};

const FavoriteItemCard: React.FC<Props> = ({ fav, onRemove }) => {
	// stateを削除し、propsから直接値を計算する通常の変数に変更Add commentMore actions
	const repositoryFullName =
		fav.owner && fav.repo ? `${fav.owner}/${fav.repo}` : "";
	return (
		<div className="group relative rounded-xl border border-gray-100 p-4 hover:shadow-lg hover:shadow-gray-200/50 transition-all">
			<div className="flex items-center justify-between mb-3">
				<div>
					<div className="text-sm text-gray-500">@{fav.owner}</div>
					<div className="text-lg font-semibold text-gray-900 font-mono">
						{repositoryFullName}
					</div>
				</div>
				<AlertDialog>
					<AlertDialogTrigger asChild>
						<Button
							variant="ghost"
							className="h-12 w-12 p-0 flex items-center justify-center"
						>
							<Heart
								height={28}
								width={28}
								className="text-red-500 fill-red-500 transition-transform duration-200 hover:scale-110"
							/>
						</Button>
					</AlertDialogTrigger>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>お気に入りから削除しますか？</AlertDialogTitle>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>キャンセル</AlertDialogCancel>
							<AlertDialogAction onClick={() => onRemove(fav.id)}>
								削除
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</div>
		</div>
	);
};

export default FavoriteItemCard;
