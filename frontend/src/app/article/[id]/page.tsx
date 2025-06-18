import ArticleDetailPage from "@/features/routes/article_detail/components/ArticleDetailPage";
import { prClient } from "@/lib/hono";

const page = async ({ params }: { params: Promise<{ id: string }> }) => {
	const resolvedParams = await params;
	// PR記事詳細データを取得
	const articleDetailRes = await prClient.repos[":owner"][":repo"].pulls[
		":number"
	].article.$get({
		param: {
			owner: "vercel",
			repo: "next.js",
			number: resolvedParams.id, // PR番号をパラメータから取得
		},
	});

	// --- エラーハンドリング ---
	if (!articleDetailRes.ok) {
		const errorData = await articleDetailRes.json();

		return (
			<div className="text-red-500">
				<h2>エラー</h2>
				<p>{errorData.message}</p>
				<p>{errorData.code}</p>
			</div>
		);
	}

	// PR詳細記事データを取得
	const articleDetailResponseJson = await articleDetailRes.json();
	const articleDetailResData = articleDetailResponseJson.data;

	return <ArticleDetailPage article={articleDetailResData} />;
};

export default page;
