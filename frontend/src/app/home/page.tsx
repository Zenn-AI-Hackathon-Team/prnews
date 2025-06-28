import ArticleList from "@/features/routes/article_list/components/ArticleList";
import { rankingClient } from "@/lib/hono";
import { userClient } from "@/lib/hono";
import type { RankedArticleInfo } from "@prnews/common";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function page() {
	// 1. サーバーサイドでCookieストアを取得
	const cookieStore = await cookies();
	const authToken = cookieStore.get("auth-token");

	// 2. Cookieが存在しない場合は、即座にログインページへリダイレクト
	if (!authToken) {
		redirect("/login");
	}

	// 3. Cookieが存在する場合、セッションが有効かバックエンドに問い合わせて検証
	const res = await userClient.users.me.$get();

	// 4. セッションが無効（APIがエラーを返した）場合もログインページへ
	if (!res.ok) {
		// 古い無効なCookieが残っている可能性があるので、ログインページにリダイレクト
		redirect("/login");
	}

	// 5. 認証成功：ユーザー情報を取得
	const userData = await res.json();
	const user = userData.data;
	// ランキングデータを取得
	const weeklyRes = await rankingClient.ranking.articles.likes.$get({
		query: {
			limit: "10",
			offset: "0",
			period: "weekly",
			language: "ja",
		},
	});

	const goodAllRes = await rankingClient.ranking.articles.likes.$get({
		query: {
			limit: "10",
			offset: "0",
			period: "all",
			language: "ja",
		},
	});

	// --- ランキングのエラーハンドリング ---
	if (!weeklyRes.ok) {
		const errorData = await weeklyRes.json();

		return (
			<div className="text-red-500">
				<h2>エラー</h2>
				<p>{errorData.message}</p>
				<p>{errorData.code}</p>
			</div>
		);
	}

	if (!goodAllRes.ok) {
		const errorData = await goodAllRes.json();

		return (
			<div className="text-red-500">
				<h2>エラー</h2>
				<p>{errorData.message}</p>
				<p>{errorData.code}</p>
			</div>
		);
	}

	// --- 成功時の処理 ---
	const weeklyResponseData = await weeklyRes.json();
	const weeklyRankingData: RankedArticleInfo[] = weeklyResponseData.data.data;

	const goodAllResponseData = await goodAllRes.json();
	const goodAllRankingData: RankedArticleInfo[] = goodAllResponseData.data.data;

	return (
		<div>
			<h1>ようこそ、{user.githubDisplayName || user.githubUsername}さん！</h1>
			<ArticleList
				weeklyArticles={weeklyRankingData}
				goodArticles={goodAllRankingData}
			/>
		</div>
	);
}
