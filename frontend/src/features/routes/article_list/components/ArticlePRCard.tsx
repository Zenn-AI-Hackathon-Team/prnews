"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prClient } from "@/lib/hono";
import type { ErrorResponse, RankedArticleInfo } from "@prnews/common";
import { GitPullRequest, ThumbsUp } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";
import { toast } from "sonner";

const ArticlePRCard = ({ pr }: { pr: RankedArticleInfo }) => {
	// 状態管理をカード単位に変更
	const [isLiked, setIsLiked] = useState(false);
	const [likeCount, setLikeCount] = useState(pr.likeCount);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleLike = useCallback(
		async (e: React.MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();

			if (isSubmitting) return;

			// 既にいいね済みの場合は、取り消し不可のメッセージを表示して処理を中断
			if (isLiked) {
				toast.info("現在、いいねの取り消しはできません。");
				return;
			}

			setIsSubmitting(true);
			const originalLikeCount = likeCount;

			// オプティミスティックUIアップデート (いいね追加のみ)
			setIsLiked(true);
			setLikeCount(originalLikeCount + 1);

			try {
				// いいねAPIを呼び出す
				const response = await prClient.repos[":owner"][":repo"].pulls[
					":number"
				].language[":langCode"].like.$post({
					param: {
						owner: pr.owner,
						repo: pr.repo,
						number: pr.prNumber.toString(),
						langCode: pr.languageCode,
					},
				});

				if (!response.ok) {
					const errorData: ErrorResponse = await response.json();
					throw new Error(errorData.message || "API request failed");
				}

				const result = await response.json();
				// サーバーからの最新のいいね数で同期
				setLikeCount(result.data.likeCount);
				toast.success(result.data.message);
			} catch (error) {
				// エラー時はUIを元に戻す
				setIsLiked(false);
				setLikeCount(originalLikeCount);
				toast.error(
					error instanceof Error
						? error.message
						: "いいねの更新中にエラーが発生しました。",
				);
			} finally {
				setIsSubmitting(false);
			}
		},
		[isLiked, likeCount, isSubmitting, pr],
	);

	// 言語表示用のマッピング
	const getLanguageDisplay = (langCode: string) => {
		if (!langCode) {
			return "Unknown";
		}

		const languageMap: Record<string, string> = {
			ja: "Japanese",
			en: "English",
			zh: "Chinese",
			ko: "Korean",
			es: "Spanish",
			fr: "French",
			de: "German",
			pt: "Portuguese",
			ru: "Russian",
			ar: "Arabic",
		};
		return languageMap[langCode] || langCode.toUpperCase();
	};

	// アバターイニシャルを生成
	const authorInitials = pr.owner.slice(0, 2).toUpperCase();

	// stateを削除し、propsから直接値を計算する通常の変数に変更Add commentMore actions
	const repositoryFullName =
		pr.owner && pr.repo ? `${pr.owner}/${pr.repo}` : "";

	// PRのステータスを判定（PR番号やランクに基づいて仮のロジック）
	const status = pr.prNumber % 3 === 0 ? "open" : "merged";

	return (
		<Link href={`/article/${pr.prNumber}`}>
			<div className="group relative bg-white rounded-xl border border-gray-100 p-6 transition-all duration-300 hover:border-gray-200 hover:shadow-lg hover:shadow-gray-200/50">
				{/* Rank Badge */}
				<div className="absolute top-6 right-6 flex items-center gap-2">
					<Badge variant="secondary" className="font-bold">
						#{pr.rank}
					</Badge>
					<div
						className={`h-2 w-2 rounded-full ${status === "merged" ? "bg-purple-500" : "bg-green-500"} animate-pulse`}
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
										@{pr.owner}
									</span>
									<span className="text-gray-300">•</span>
									<span className="text-sm text-gray-500">
										PR #{pr.prNumber}
									</span>
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
							className={`mt-1 rounded-lg p-1.5 ${status === "merged" ? "bg-purple-50" : "bg-green-50"}`}
						>
							<GitPullRequest
								className={`h-4 w-4 ${status === "merged" ? "text-purple-600" : "text-green-600"}`}
							/>
						</div>
						<h3 className="flex-1 font-semibold text-gray-900 leading-relaxed group-hover:text-primary transition-colors cursor-pointer">
							{pr.aiGeneratedTitle}
						</h3>
					</div>

					{/* Footer with Actions */}
					<div className="flex items-center justify-between pt-2">
						<div className="flex items-center gap-4">
							<Badge
								variant="outline"
								className="text-xs gap-1.5 border-gray-200"
							>
								{getLanguageDisplay(pr.languageCode)}
							</Badge>
							<Badge
								variant="outline"
								className="text-xs capitalize border-gray-200"
							>
								{status}
							</Badge>
						</div>

						{/* Goods Button */}
						<Button
							variant={isLiked ? "default" : "ghost"}
							size="sm"
							className={`gap-2 transition-all duration-200 ${
								isLiked
									? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md"
									: "hover:bg-gray-100"
							}`}
							onClick={handleLike}
						>
							<ThumbsUp
								className={`h-4 w-4 transition-transform duration-200 ${isLiked ? "fill-current scale-110" : ""}`}
							/>
							<span className="font-semibold tabular-nums">
								{pr.likeCount + (isLiked ? 1 : 0)}
							</span>
						</Button>
					</div>
				</div>

				{/* Hover Accent */}
				<div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
			</div>
		</Link>
	);
};

export default ArticlePRCard;
