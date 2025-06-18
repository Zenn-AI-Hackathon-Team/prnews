import PRList from "@/features/routes/pr_list/components/PRList";

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
	// // まずお気に入りリポジトリを取得
	// const favoritesRes = await userClient.users.me["favorite-repositories"].$get({
	//   query: {
	//     limit: "20",
	//     offset: "0",
	//   },
	// });

	// // --- お気に入りリポジトリのエラーハンドリング ---
	// if (!favoritesRes.ok) {
	//   const errorData = await favoritesRes.json();

	//   return (
	//     <div className="text-red-500">
	//       <h2>エラー</h2>
	//       <p>{errorData.message}</p>
	//       <p>{errorData.code}</p>
	//     </div>
	//   );
	// }

	// // お気に入りリポジトリのデータを取得
	// const favoritesResponseData = await favoritesRes.json();
	// const favoriteReposData = favoritesResponseData.data.data;
	// const favoriteRepos = favoriteReposData.map((repo) => ({
	//   owner: repo.owner,
	//   repo: repo.repositoryFullName,
	// }));

	// // 各お気に入りリポジトリから新しいPRを取得
	// const newPRPromises = favoriteRepos.map(
	//   async (repo: { owner: string; repo: string }) => {
	//     try {
	//       const res = await prClient.repos[":owner"][":repo"].pulls.$get({
	//         param: {
	//           owner: repo.owner,
	//           repo: repo.repo,
	//         },
	//         query: {
	//           state: "all",
	//           per_page: "20",
	//           page: "1",
	//         },
	//       });

	//       if (!res.ok) {
	//         console.error(`Failed to fetch PRs for ${repo.owner}/${repo.repo}`);
	//         return [];
	//       }

	//       const data = await res.json();
	//       const prs: newPR[] = data.data || [];

	//       // 各PRにownerとrepoの情報を追加
	//       return prs.map((pr) => ({
	//         ...pr,
	//         owner: repo.owner,
	//         repo: repo.repo,
	//       }));
	//     } catch (error) {
	//       console.error(
	//         `Error fetching PRs for ${repo.owner}/${repo.repo}:`,
	//         error
	//       );
	//       return [];
	//     }
	//   }
	// );

	// // すべてのPRを並行して取得
	// const allNewPRs = await Promise.all(newPRPromises);

	// // 配列をフラット化して、すべてのPRを1つの配列にまとめる
	// const newPRData = allNewPRs.flat();
	const damyPRData: newPR[] = [
		{
			prNumber: 4183,
			title: "Add feature",
			authorLogin: "masa",
			githubPrUrl: "https://github.com/masa-massara/NotiPal/pull/1",
			state: "open",
			createdAt: "2024-01-01T00:00:00Z",
			articleExists: true,
		},
		{
			prNumber: 42,
			title: "Add feature",
			authorLogin: "masa",
			githubPrUrl: "https://github.com/masa-massara/NotiPal/pull/1",
			state: "open",
			createdAt: "2024-01-01T00:00:00Z",
			articleExists: false,
			owner: "vercel",
			repo: "next.js",
		},
	];

	// 新しいPRデータをログ出力
	// console.log("New PRs from favorite repos:", newPRData);

	return (
		<div>
			<PRList newPRs={damyPRData} />
		</div>
	);
};

export default page;
