"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import type { PullRequestArticle } from "@prnews/common";
import {
	AlertCircle,
	Clock,
	Code,
	FileText,
	GitPullRequest,
	MessageCircle,
	Shield,
	Sparkles,
	ThumbsUp,
	User,
	Zap,
} from "lucide-react";
import { useState } from "react";

// Props型定義
type ArticleDetailPageProps = {
	article: PullRequestArticle;
	language?: string;
};

// カテゴリーのアイコンとカラーマッピング
const categoryIcons = {
	TECH: <Code className="h-4 w-4" />,
	RISK: <AlertCircle className="h-4 w-4" />,
	UX: <User className="h-4 w-4" />,
	PERF: <Zap className="h-4 w-4" />,
	SECURITY: <Shield className="h-4 w-4" />,
};

const categoryColors = {
	TECH: "text-purple-600 bg-purple-50",
	RISK: "text-red-600 bg-red-50",
	UX: "text-blue-600 bg-blue-50",
	PERF: "text-orange-600 bg-orange-50",
	SECURITY: "text-green-600 bg-green-50",
};

const categoryLabels = {
	TECH: "技術的に興味深い",
	RISK: "影響範囲が大きい",
	UX: "ユーザ体験に影響",
	PERF: "性能面の影響",
	SECURITY: "セキュリティ観点",
};

// 変更タイプのカラーマッピング
const changeTypeColors = {
	FEAT: "text-purple-600 bg-purple-50",
	FIX: "text-blue-600 bg-blue-50",
	REFACTOR: "text-orange-600 bg-orange-50",
	DOCS: "text-gray-600 bg-gray-50",
	TEST: "text-green-600 bg-green-50",
	PERF: "text-red-600 bg-red-50",
	BUILD: "text-yellow-600 bg-yellow-50",
	CHORE: "text-pink-600 bg-pink-50",
};

const changeTypeLabels = {
	FEAT: "機能追加",
	FIX: "バグ修正",
	REFACTOR: "リファクタ",
	DOCS: "ドキュメント",
	TEST: "テスト関連",
	PERF: "性能改善",
	BUILD: "ビルド/CI",
	CHORE: "その他雑務",
};

const ArticleDetailPage = ({
	article,
	language = "ja",
}: ArticleDetailPageProps) => {
	const [isLiked, setIsLiked] = useState(false);

	const repositoryFullName =
		article.owner && article.repo ? `${article.owner}/${article.repo}` : "";

	const goodsCount = article.totalLikeCount + (isLiked ? 1 : 0);

	const handleLike = () => {
		setIsLiked(!isLiked);
	};

	// PRのステータスを判定（コメントから推測）
	// PRのステータスを判定（コメントから推測）
	const isPROpen = !article.comments?.some(
		(comment) =>
			comment.body.toLowerCase().includes("merged") ||
			comment.body.toLowerCase().includes("will merge"),
	);

	// 作成日時をフォーマット
	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString("ja-JP", {
			year: "numeric",
			month: "long",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	// コンテンツが存在しない場合
	if (!article.contents) {
		return (
			<div className="w-full max-w-5xl mx-auto p-8">
				<Card>
					<CardContent className="p-8 text-center">
						<p className="text-gray-500">記事内容がまだ作成されていません。</p>
						<a
							href={article.githubPrUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="mt-4 inline-block"
						>
							<Button variant="outline" className="gap-2">
								<GitPullRequest className="h-4 w-4" />
								GitHubでPRを確認
							</Button>
						</a>
					</CardContent>
				</Card>
			</div>
		);
	}

	const content = article.contents[language];

	// 選択された言語のコンテンツがない場合
	if (!content) {
		const availableLanguages = Object.keys(article.contents);
		return (
			<div className="w-full max-w-5xl mx-auto p-8">
				<Card>
					<CardContent className="p-8 text-center">
						<p className="text-gray-500 mb-4">
							選択された言語（{language}）のコンテンツがありません。
						</p>
						<p className="text-sm text-gray-400 mb-4">
							利用可能な言語: {availableLanguages.join(", ")}
						</p>
						<a
							href={article.githubPrUrl}
							target="_blank"
							rel="noopener noreferrer"
						>
							<Button variant="outline" className="gap-2">
								<GitPullRequest className="h-4 w-4" />
								GitHubでPRを確認
							</Button>
						</a>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="w-full max-w-5xl mx-auto space-y-8">
			{/* Header Section */}
			<div className="space-y-6">
				<div className="flex items-start justify-between gap-4">
					<div className="flex-1 space-y-3">
						<div className="flex items-center gap-3">
							<div
								className={`rounded-lg p-2 ${isPROpen ? "bg-green-50" : "bg-purple-50"}`}
							>
								<GitPullRequest
									className={`h-6 w-6 ${isPROpen ? "text-green-600" : "text-purple-600"}`}
								/>
							</div>
							<Badge
								variant={isPROpen ? "outline" : "secondary"}
								className="capitalize"
							>
								{isPROpen ? "open" : "merged"}
							</Badge>
							<Badge variant="outline" className="font-mono">
								PR #{article.prNumber}
							</Badge>
						</div>
						<h1 className="text-3xl font-bold text-gray-900">
							{content.aiGeneratedTitle}
						</h1>
						<div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
							<a
								href={article.githubPrUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="hover:text-blue-600 transition-colors"
							>
								<Badge variant="outline" className="font-mono">
									{repositoryFullName}
								</Badge>
							</a>
							<div className="flex items-center gap-1">
								<User className="h-4 w-4" />
								<span>@{article.authorLogin}</span>
							</div>
							<div className="flex items-center gap-1">
								<Clock className="h-4 w-4" />
								<span>{formatDate(article.githubPrCreatedAt)}</span>
							</div>
						</div>
					</div>
					<Button
						variant={isLiked ? "default" : "outline"}
						size="lg"
						className={`gap-2 ${
							isLiked
								? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
								: ""
						}`}
						onClick={handleLike}
					>
						<ThumbsUp className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`} />
						<span className="font-semibold tabular-nums">{goodsCount}</span>
					</Button>
				</div>
			</div>

			{/* Background Section */}
			{content.backgroundAndPurpose && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<AlertCircle className="h-5 w-5" />
							背景・目的
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
							{content.backgroundAndPurpose}
						</p>
					</CardContent>
				</Card>
			)}

			{/* Main Changes Section */}
			{content.mainChanges && content.mainChanges.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<FileText className="h-5 w-5" />
							主な変更点
						</CardTitle>
						<CardDescription>
							{content.mainChanges.length} 件の変更
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{content.mainChanges.map((change) => (
								<div
									key={`${change.fileName}-${change.changeTypes.join("-")}`}
									className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
								>
									<div className="flex items-start gap-3">
										<div className="flex flex-wrap gap-2 min-w-fit">
											{change.changeTypes.map((type) => (
												<Badge
													key={`${change.fileName}-${type}`}
													variant="outline"
													className={`text-xs ${changeTypeColors[type]}`}
												>
													{changeTypeLabels[type]}
												</Badge>
											))}
										</div>
										<div className="flex-1 space-y-2">
											<p className="font-mono text-sm text-gray-700">
												{change.fileName}
											</p>
											<p className="text-gray-600">{change.description}</p>
										</div>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Notable Points Section */}
			{content.notablePoints && content.notablePoints.length > 0 && (
				<div className="space-y-6">
					<h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
						<Sparkles className="h-6 w-6 text-yellow-500" />
						注目ポイント
					</h2>

					{content.notablePoints.map((point) => (
						<Card
							key={`notable-${point.categories.join("-")}-${point.point.slice(0, 20)}`}
							className="overflow-hidden"
						>
							<CardHeader className="pb-3">
								<div className="flex flex-wrap gap-2">
									{point.categories.map((category) => (
										<div
											key={`${point.point.slice(0, 20)}-${category}`}
											className="flex items-center gap-2"
										>
											<div
												className={`p-1.5 rounded-lg ${categoryColors[category]}`}
											>
												{categoryIcons[category]}
											</div>
											<Badge variant="outline" className="text-xs">
												{categoryLabels[category]}
											</Badge>
										</div>
									))}
								</div>
							</CardHeader>
							<CardContent>
								<p className="text-gray-700 leading-relaxed">{point.point}</p>
							</CardContent>
						</Card>
					))}
				</div>
			)}

			{/* Comments Section */}
			{article.comments && article.comments.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<MessageCircle className="h-5 w-5" />
							コメント
						</CardTitle>
						<CardDescription>
							{article.comments.length} 件のコメント
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{article.comments.slice(0, 5).map((comment) => (
								<div
									key={`comment-${comment.author}-${comment.createdAt}`}
									className="space-y-2 pb-4 border-b last:border-0"
								>
									<div className="flex items-center gap-2 text-sm">
										<span className="font-medium text-gray-900">
											@{comment.author}
										</span>
										<span className="text-gray-500">
											{formatDate(comment.createdAt)}
										</span>
									</div>
									<p className="text-gray-700 text-sm line-clamp-3">
										{comment.body}
									</p>
								</div>
							))}
							{article.comments.length > 5 && (
								<a
									href={article.githubPrUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="text-blue-600 hover:text-blue-800 text-sm font-medium"
								>
									GitHubで全てのコメントを見る →
								</a>
							)}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Original PR Link */}
			<Card>
				<CardContent className="p-6">
					<div className="flex items-center justify-between">
						<div className="space-y-1">
							<p className="text-sm text-gray-600">オリジナルのPRを確認</p>
							<p className="font-mono text-sm">{repositoryFullName}</p>
							{content.summaryGeneratedAt && (
								<p className="text-xs text-gray-500">
									要約生成日時: {formatDate(content.summaryGeneratedAt)}
								</p>
							)}
						</div>
						<a
							href={article.githubPrUrl}
							target="_blank"
							rel="noopener noreferrer"
						>
							<Button variant="outline" className="gap-2">
								<GitPullRequest className="h-4 w-4" />
								GitHubで見る
							</Button>
						</a>
					</div>
				</CardContent>
			</Card>
		</div>
	);
};

export default ArticleDetailPage;
