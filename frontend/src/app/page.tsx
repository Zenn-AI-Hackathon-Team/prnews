import { Button } from "@/components/ui/button";
import { validateAuthCookie } from "@/features/common/functions/cookie/cookieCheck";
import {
	ArrowRight,
	GitPullRequest,
	Heart,
	Sparkles,
	TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function RootPage() {
	const isAuthenticated = await validateAuthCookie();

	// 既にログイン済みの場合はホームページへリダイレクト
	if (isAuthenticated) {
		redirect("/home");
	}

	return (
		<div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
			{/* 装飾的な背景要素 */}
			<div className="absolute top-20 left-10 h-64 w-64 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 blur-3xl opacity-40 dark:from-blue-900/20 dark:to-purple-900/20" />
			<div className="absolute bottom-20 right-10 h-64 w-64 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 blur-3xl opacity-40 dark:from-purple-900/20 dark:to-pink-900/20" />
			<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-gradient-to-br from-yellow-100 to-orange-100 blur-3xl opacity-30 dark:from-yellow-900/10 dark:to-orange-900/10" />

			<div className="relative flex min-h-screen flex-col items-center justify-center p-6">
				<div className="w-full max-w-3xl space-y-12 text-center">
					{/* ロゴとタイトル */}
					<div className="space-y-6">
						<div className="flex justify-center">
							<div className="relative">
								<div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-2xl shadow-primary/25 transition-transform hover:scale-105">
									<img src="/PRNews.png" alt="PR News" className="h-20 w-20" />
								</div>
								<div className="absolute -top-2 -right-2">
									<Sparkles className="h-6 w-6 text-yellow-500 animate-pulse" />
								</div>
							</div>
						</div>

						<div className="space-y-4">
							<h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent dark:from-gray-100 dark:via-gray-200 dark:to-gray-100">
								PR-Newsへようこそ！
							</h1>
							<p className="text-xl text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
								最新の技術トレンドを、プルリクエストから学びましょう。
								<br />
								エンジニアリングの最前線を体験してください。
							</p>
						</div>
					</div>

					{/* 特徴セクション */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
						<div className="group relative bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
							<div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
							<div className="flex items-start gap-4">
								<div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3">
									<GitPullRequest className="h-6 w-6 text-blue-600 dark:text-blue-400" />
								</div>
								<div className="flex-1">
									<h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
										最新のPRを発見
									</h3>
									<p className="text-sm text-gray-600 dark:text-gray-400">
										注目のライブラリから最新の変更を追跡
									</p>
								</div>
							</div>
						</div>

						<div className="group relative bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
							<div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
							<div className="flex items-start gap-4">
								<div className="rounded-lg bg-purple-50 dark:bg-purple-900/20 p-3">
									<TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
								</div>
								<div className="flex-1">
									<h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
										トレンドを把握
									</h3>
									<p className="text-sm text-gray-600 dark:text-gray-400">
										人気のPRから技術動向を学習
									</p>
								</div>
							</div>
						</div>

						<div className="group relative bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
							<div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-pink-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
							<div className="flex items-start gap-4">
								<div className="rounded-lg bg-pink-50 dark:bg-pink-900/20 p-3">
									<Heart className="h-6 w-6 text-pink-600 dark:text-pink-400" />
								</div>
								<div className="flex-1">
									<h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
										お気に入り管理
									</h3>
									<p className="text-sm text-gray-600 dark:text-gray-400">
										関心のあるリポジトリをフォロー
									</p>
								</div>
							</div>
						</div>
					</div>

					{/* CTAセクション */}
					<div className="space-y-4">
						<Button
							asChild
							size="lg"
							className="h-14 px-10 text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 dark:from-gray-100 dark:to-gray-200 dark:text-gray-900 dark:hover:from-gray-200 dark:hover:to-gray-300 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] group"
						>
							<Link href="/login">
								GitHubアカウントで始める
								<ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
							</Link>
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
