"use client";
import type { newPR } from "@/app/pr-issue/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prClient } from "@/lib/hono";
import { FileText, GitPullRequest, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

const NewPRCard = ({ pr }: { pr: newPR }) => {
	const [isGenerating, setIsGenerating] = useState(false);
	const router = useRouter();

	const author = pr.owner ?? "";
	const repoName = pr.repo ?? "";

	// アバターイニシャルを生成
	const authorInitials = author.slice(0, 2).toUpperCase();

	// stateを削除し、propsから直接値を計算する通常の変数に変更Add commentMore actions
	const repositoryFullName = author && repoName ? `${author}/${repoName}` : "";

	// 記事生成のハンドラー
	const handleGenerateArticle = async (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		if (!pr.owner || !pr.repo) {
			toast.error("記事の生成に必要な情報が不足しています。");
			console.error("PR情報にownerまたはrepoがありません");
			return;
		}

		setIsGenerating(true);

		try {
			// 1. まずPR情報をDBに取り込む (ingest)
			const ingestResponse = await prClient.repos[":owner"][":repo"].pulls[
				":number"
			].ingest.$post({
				param: {
					owner: pr.owner,
					repo: pr.repo,
					number: pr.prNumber.toString(),
				},
			});

			if (!ingestResponse.ok) {
				const errorData = await ingestResponse.json();
				console.error("記事の取り込みに失敗しました:", errorData);
				toast.error("記事の取り込みに失敗しました。", {
					description: errorData.message,
				});
				setIsGenerating(false);
				return;
			}

			toast.info("PR情報の取り込みが完了しました。記事の生成を開始します...");

			// 2. 取り込みが成功したら、記事を生成する
			const generateArticleResponse = await prClient.repos[":owner"][
				":repo"
			].pulls[":number"].article.$post({
				param: {
					owner: pr.owner,
					repo: pr.repo,
					number: pr.prNumber.toString(),
				},
			});

			if (generateArticleResponse.ok) {
				toast.success("記事の生成に成功しました！");
				// 生成成功後、記事ページへ遷移
				router.push(`/article/${pr.prNumber}`);
			} else {
				const errorData = await generateArticleResponse.json();
				console.error("記事の生成に失敗しました:", errorData);
				toast.error("記事の生成に失敗しました。", {
					description: errorData.message,
				});
			}
		} catch (error) {
			console.error("記事生成プロセスでエラーが発生しました:", error);
			toast.error("記事の生成中に予期せぬエラーが発生しました。");
		} finally {
			setIsGenerating(false);
		}
	};

	const cardContent = (
		<div className="group relative bg-white rounded-xl border border-gray-100 p-6 transition-all duration-300 hover:border-gray-200 hover:shadow-lg hover:shadow-gray-200/50">
			{/* Rank Badge */}
			<div className="absolute top-6 right-6 flex items-center gap-2">
				<Badge variant="secondary" className="font-bold">
					#{pr.prNumber}
				</Badge>
				<div
					className={`h-2 w-2 rounded-full ${pr.state === "closed" ? "bg-purple-500" : "bg-green-500"} animate-pulse`}
				/>
			</div>

			<div className="space-y-4">
				{/* Header with Avatar and Repository */}
				<div className="flex items-start justify-between gap-4">
					<div className="flex items-center gap-3">
						<div className="relative">
							<div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200 text-sm font-semibold text-gray-700">
								{authorInitials}
							</div>
						</div>
						<div>
							<div className="flex items-center gap-2">
								<span className="text-sm font-medium text-gray-900">
									@{author}
								</span>
								<span className="text-gray-300">•</span>
								<span className="text-sm text-gray-500">PR #{pr.prNumber}</span>
							</div>
							<Badge
								variant="secondary"
								className="mt-1 font-mono text-xs px-2 py-0.5 bg-gray-100/80"
							>
								{repositoryFullName}
							</Badge>
						</div>
					</div>
				</div>

				{/* PR Title */}
				<div className="flex items-start gap-3">
					<div
						className={`mt-1 rounded-lg p-1.5 ${pr.state === "closed" ? "bg-purple-50" : "bg-green-50"}`}
					>
						<GitPullRequest
							className={`h-4 w-4 ${pr.state === "closed" ? "text-purple-600" : "text-green-600"}`}
						/>
					</div>
					<h3 className="flex-1 font-semibold text-gray-900 leading-relaxed group-hover:text-primary transition-colors cursor-pointer">
						{pr.title}
					</h3>
				</div>

				{/* Article Status / Action Button */}
				<div className="pt-2">
					{pr.articleExists ? (
						<div className="flex items-center gap-2 text-sm text-gray-600">
							<FileText className="h-4 w-4" />
							<span>記事が利用可能</span>
						</div>
					) : (
						<Button
							onClick={handleGenerateArticle}
							disabled={isGenerating}
							variant="outline"
							size="sm"
							className="w-full group/button transition-all duration-200 hover:bg-primary hover:text-white hover:border-primary"
						>
							{isGenerating ? (
								<>
									<Sparkles className="mr-2 h-4 w-4 animate-spin" />
									記事を生成中...
								</>
							) : (
								<>
									<Sparkles className="mr-2 h-4 w-4 group-hover/button:animate-pulse" />
									記事を生成する
								</>
							)}
						</Button>
					)}
				</div>
			</div>

			{/* Hover Accent */}
			<div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
		</div>
	);

	// articleExistsがtrueの場合はリンクでラップ、falseの場合はそのまま表示
	if (pr.articleExists) {
		return <Link href={`/article/${pr.prNumber}`}>{cardContent}</Link>;
	}

	return cardContent;
};

export default NewPRCard;
