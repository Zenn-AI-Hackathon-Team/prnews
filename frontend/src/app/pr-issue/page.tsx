import PRList from "@/features/routes/pr_list/components/PRList";
import { prClient, userClient } from "@/lib/hono";

// PR型定義 - 新しいAPIのデータ構造に合わせて更新
export type newPR = {
	prNumber: number;
	title: string;
	authorLogin: string;
	githubPrUrl: string;
	state: string;
	createdAt: string;
	articleExists: boolean;
	owner?: string;
	repo?: string;
};

const page = async () => {
	// まずお気に入りリポジトリを取得
	const favoritesRes = await userClient.users.me["favorite-repositories"].$get({
		query: {
			limit: "20",
			offset: "0",
		},
	});

	// --- お気に入りリポジトリのエラーハンドリング ---
	if (!favoritesRes.ok) {
		const errorData = await favoritesRes.json();

		return (
			<div className="text-red-500">
				<h2>エラー</h2>
				<p>{errorData.message}</p>
				<p>{errorData.code}</p>
			</div>
		);
	}

	// お気に入りリポジトリのデータを取得
	const favoritesResponseData = await favoritesRes.json();
	const favoriteReposData = favoritesResponseData.data.data;
	const favoriteRepos = favoriteReposData.map((fav) => ({
		owner: fav.owner,
		repo: fav.repo,
	}));

	// 各お気に入りリポジトリから新しいPRを取得
	const newPRPromises = favoriteRepos.map(
		async (repo: { owner: string; repo: string }) => {
			try {
				const res = await prClient.repos[":owner"][":repo"].pulls.$get({
					param: {
						owner: repo.owner,
						repo: repo.repo,
					},
					query: {
						state: "all",
						per_page: "20",
						page: "1",
					},
				});

				if (!res.ok) {
					console.error(`Failed to fetch PRs for ${repo.owner}/${repo.repo}`);
					return [];
				}

				const data = await res.json();
				const prs: newPR[] = data.data || [];

				return prs;
			} catch (error) {
				console.error(
					`Error fetching PRs for ${repo.owner}/${repo.repo}:`,
					error,
				);
				return [];
			}
		},
	);

	// すべてのPRを並行して取得
	const allNewPRs = await Promise.all(newPRPromises);

	// 配列をフラット化して、すべてのPRを1つの配列にまとめる
	const newPRData = allNewPRs.flat();

	return (
		<div>
			<PRList newPRs={newPRData} />
		</div>
	);
};

export default page;
