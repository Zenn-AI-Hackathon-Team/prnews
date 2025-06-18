"use client";
import type { newPR } from "@/app/pr-issue/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Logo from "@/features/common/logo/components/Logo";
import { Clock, Sparkles, TrendingUp } from "lucide-react";
import type React from "react";
import { useState } from "react";
import NewPRCard from "./NewPRCard";

// Props型定義
type PRListProps = {
	newPRs: newPR[];
	onRefresh?: () => void;
};

const PRList: React.FC<PRListProps> = ({ newPRs, onRefresh }) => {
	const [activeTab, setActiveTab] = useState("newPRs");

	return (
		<div className="w-full max-w-7xl mx-auto space-y-8">
			{/* Page Header */}
			<div className="relative">
				<div className="absolute -top-4 -left-4 h-20 w-20 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 blur-2xl opacity-70" />
				<div className="relative space-y-3">
					<Logo />
					<p className="text-gray-600 text-lg w-full">
						注目のプルリクエストをチェックして、最新の技術トレンドを把握しましょう
					</p>
				</div>
			</div>

			{/* Tabs */}
			<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
				<TabsList className="grid w-full max-w-lg grid-cols-2 h-12 p-1 bg-gray-100/50">
					<TabsTrigger
						value="newPRs"
						className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
					>
						<Sparkles className="h-4 w-4" />
						<span className="font-medium">New PR</span>
					</TabsTrigger>
					<TabsTrigger
						value="newIssues"
						className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
					>
						<Sparkles className="h-4 w-4" />
						<span className="font-medium">New Issue</span>
					</TabsTrigger>
				</TabsList>

				{/* New PRs */}
				<TabsContent value="newPRs" className="space-y-6 mt-8">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<h2 className="text-2xl font-bold text-gray-900">
								New PullRequests
							</h2>
							<Badge className="gap-1.5 bg-blue-100 text-blue-700 hover:bg-blue-100">
								<TrendingUp className="h-3 w-3" />
								{newPRs.length} PRs
							</Badge>
						</div>
						{onRefresh && (
							<Button
								variant="outline"
								size="sm"
								className="gap-2"
								onClick={onRefresh}
							>
								<Clock className="h-4 w-4" />
								更新
							</Button>
						)}
					</div>
					<div className="grid gap-4">
						{newPRs.map((pr) => (
							<NewPRCard key={pr.prNumber} pr={pr} />
						))}
					</div>
				</TabsContent>

				{/* New Issues */}
				<TabsContent value="newIssues" className="space-y-6 mt-8">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<h2 className="text-2xl font-bold text-gray-900">New Issuses</h2>
							<Badge className="gap-1.5 bg-blue-100 text-blue-700 hover:bg-blue-100">
								<TrendingUp className="h-3 w-3" />
								{newPRs.length} Issues
							</Badge>
						</div>
						{onRefresh && (
							<Button
								variant="outline"
								size="sm"
								className="gap-2"
								onClick={onRefresh}
							>
								<Clock className="h-4 w-4" />
								更新
							</Button>
						)}
					</div>
					<div className="grid gap-4">comming soon...</div>
				</TabsContent>
			</Tabs>
		</div>
	);
};

export default PRList;
