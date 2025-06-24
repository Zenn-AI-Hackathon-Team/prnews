import AddFavoriteForm from "@/features/routes/favorites/components/AddFavoriteForm";
import FavoriteList from "@/features/routes/favorites/components/FavoriteList";
import type { FavoriteRepository } from "@prnews/common";

// ダミーデータ
const sampleFavorites: FavoriteRepository[] = [
	{
		id: "1",
		userId: "user1",
		githubRepoId: 1,
		owner: "vercel",
		repo: "next.js",
		registeredAt: new Date().toISOString(),
	},
	{
		id: "2",
		userId: "user1",
		githubRepoId: 2,
		owner: "facebook",
		repo: "react",
		registeredAt: new Date().toISOString(),
	},
];

const page = () => {
	return (
		<div className="w-full max-w-7xl mx-auto space-y-8">
			<AddFavoriteForm isLoading={false} />
			<FavoriteList favorites={sampleFavorites} />
		</div>
	);
};

export default page;
