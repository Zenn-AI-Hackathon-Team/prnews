"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Logo from "@/features/common/logo/components/Logo";
import { Calendar, Clock, Flame, TrendingUp } from "lucide-react";
import type React from "react";
import { useState } from "react";
import PRCard from "./PRCard";

// PR型定義
export type PR = {
	id: number;
	title: string;
	repository: string;
	goods: number;
	author: string;
	authorAvatar: string;
	createdAt: string;
	language: string;
	status: "merged" | "open";
};

// Props型定義
type PRListProps = {
	weeklyPRs: PR[];
	goodPRs: PR[];
	onRefresh?: () => void;
};

const PRList: React.FC<PRListProps> = ({ weeklyPRs, goodPRs, onRefresh }) => {
	const [activeTab, setActiveTab] = useState("weekly");

	return (
		<div className="w-full max-w-7xl mx-auto space-y-8">
			{/* Page Header */}
			<div className="relative">
				<div className="absolute -top-4 -left-4 h-20 w-20 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 blur-2xl opacity-70" />
				<div className="relative space-y-3">
					<Logo />
					<p className="text-gray-600 text-lg w-full">
						注目のプルリクエストをチェックして、OSSコミュニティの最新動向を把握しましょう
					</p>
				</div>
			</div>

			{/* Tabs */}
			<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
				<TabsList className="grid w-full max-w-md grid-cols-2 h-12 p-1 bg-gray-100/50">
					<TabsTrigger
						value="weekly"
						className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
					>
						<Calendar className="h-4 w-4" />
						<span className="font-medium">Weekly PR</span>
					</TabsTrigger>
					<TabsTrigger
						value="good"
						className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
					>
						<Flame className="h-4 w-4" />
						<span className="font-medium">Good PR</span>
					</TabsTrigger>
				</TabsList>

				{/* Weekly PRs */}
				<TabsContent value="weekly" className="space-y-6 mt-8">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<h2 className="text-2xl font-bold text-gray-900">今週の注目PR</h2>
							<Badge className="gap-1.5 bg-blue-100 text-blue-700 hover:bg-blue-100">
								<TrendingUp className="h-3 w-3" />
								{weeklyPRs.length} PRs
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
						{weeklyPRs.map((pr) => (
							<PRCard key={pr.id} pr={pr} />
						))}
					</div>
				</TabsContent>

				{/* Good PRs */}
				<TabsContent value="good" className="space-y-6 mt-8">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<h2 className="text-2xl font-bold text-gray-900">高評価のPR</h2>
							<Badge className="gap-1.5 bg-purple-100 text-purple-700 hover:bg-purple-100">
								<Flame className="h-3 w-3" />
								{goodPRs.length} PRs
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
						{goodPRs.map((pr) => (
							<PRCard key={pr.id} pr={pr} />
						))}
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
};

export default PRList;
