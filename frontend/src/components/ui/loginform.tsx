"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Github, Sparkles } from "lucide-react";

type LoginFormProps = {
	onGithubLogin: () => void;
} & React.ComponentProps<"div">;

export function LoginForm({
	onGithubLogin,
	className,
	...props
}: LoginFormProps) {
	return (
		<div className={cn("w-full max-w-md", className)} {...props}>
			{/* 装飾的な背景ブラー */}
			<div className="absolute -top-20 -left-20 h-40 w-40 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 blur-3xl opacity-70" />
			<div className="absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 blur-3xl opacity-70" />

			<Card className="relative overflow-hidden bg-white/95 backdrop-blur-sm border-gray-100 shadow-lg">
				{/* 上部のアクセントライン */}
				<div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

				<CardHeader className="space-y-6 pb-4 pt-8">
					{/* ロゴセクション */}
					<div className="flex justify-center">
						<div className="relative">
							<div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25">
								<img src="/PRNews.png" alt="PR News" className="h-16 w-16" />
							</div>
							<div className="absolute -top-1 -right-1">
								<Sparkles className="h-5 w-5 text-yellow-500 animate-pulse" />
							</div>
						</div>
					</div>

					<div className="space-y-2 text-center">
						<CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
							PR-Newsへようこそ
						</CardTitle>
						<CardDescription className="text-base text-gray-600">
							GitHubアカウントでログインして
							<br />
							最新の技術トレンドを発見しましょう
						</CardDescription>
					</div>
				</CardHeader>

				<CardContent className="pb-8">
					<Button
						variant="default"
						size="lg"
						className="w-full h-12 text-base font-medium bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 text-white shadow-md transition-all duration-200 hover:shadow-lg hover:scale-[1.02] group"
						type="button"
						onClick={onGithubLogin}
					>
						<Github className="mr-2 h-5 w-5 transition-transform group-hover:rotate-12" />
						GitHubでサインイン
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
