import AddFavoriteForm from "@/features/routes/favorites/components/AddFavoriteForm";
import FavoriteList from "@/features/routes/favorites/components/FavoriteList";

const page = () => {
	return (
		<div className="w-full max-w-7xl mx-auto space-y-8">
			<AddFavoriteForm isLoading={false} />
			<FavoriteList />
		</div>
	);
};

export default page;
