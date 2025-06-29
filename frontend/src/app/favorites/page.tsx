"use client";
import AddFavoriteForm from "@/features/routes/favorites/components/AddFavoriteForm";
import FavoriteList from "@/features/routes/favorites/components/FavoriteList";
import { useFavorites } from "@/features/routes/favorites/hooks";

const page = () => {
	const { favorites, isLoading, error, refetch, onDelete } = useFavorites();

	return (
		<div className="w-full max-w-7xl mx-auto space-y-8">
			<AddFavoriteForm refetch={refetch} />
			<FavoriteList
				favorites={favorites}
				isLoading={isLoading}
				error={error}
				onDelete={(owner: string, repo: string) => onDelete(owner, repo)}
			/>
		</div>
	);
};

export default page;
