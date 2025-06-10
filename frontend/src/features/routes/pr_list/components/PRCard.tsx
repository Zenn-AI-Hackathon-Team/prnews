"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GitPullRequest, ThumbsUp } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";

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

const PRCard = ({ pr }: { pr: PR }) => {
	const [likedPRs, setLikedPRs] = useState<number[]>([]);

	const isLiked = likedPRs.includes(pr.id);

	const handleLike = (prId: number) => {
		setLikedPRs((prev) =>
			prev.includes(prId) ? prev.filter((id) => id !== prId) : [...prev, prId],
		);
	};

	return (
		<Link href={`/home/${pr.id}`}>
			<div className="group relative bg-white rounded-xl border border-gray-100 p-6 transition-all duration-300 hover:border-gray-200 hover:shadow-lg hover:shadow-gray-200/50">
				{/* Status Indicator */}
				<div className="absolute top-6 right-6">
					<div
						className={`h-2 w-2 rounded-full ${pr.status === "merged" ? "bg-purple-500" : "bg-green-500"} animate-pulse`}
					/>
				</div>

				<div className="space-y-4">
					{/* Header with Avatar and Repository */}
					<div className="flex items-start justify-between gap-4">
						<div className="flex items-center gap-3">
							<div className="relative">
								<div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200 text-sm font-semibold text-gray-700">
									{pr.authorAvatar}
								</div>
							</div>
							<div>
								<div className="flex items-center gap-2">
									<span className="text-sm font-medium text-gray-900">
										@{pr.author}
									</span>
									<span className="text-gray-300">•</span>
									<span className="text-sm text-gray-500">{pr.createdAt}</span>
								</div>
								<Badge
									variant="secondary"
									className="mt-1 font-mono text-xs px-2 py-0.5 bg-gray-100/80"
								>
									{pr.repository}
								</Badge>
							</div>
						</div>
					</div>

					{/* PR Title */}
					<div className="flex items-start gap-3">
						<div
							className={`mt-1 rounded-lg p-1.5 ${pr.status === "merged" ? "bg-purple-50" : "bg-green-50"}`}
						>
							<GitPullRequest
								className={`h-4 w-4 ${pr.status === "merged" ? "text-purple-600" : "text-green-600"}`}
							/>
						</div>
						<h3 className="flex-1 font-semibold text-gray-900 leading-relaxed group-hover:text-primary transition-colors cursor-pointer">
							{pr.title}
						</h3>
					</div>

					{/* Footer with Actions */}
					<div className="flex items-center justify-between pt-2">
						<div className="flex items-center gap-4">
							<Badge
								variant="outline"
								className="text-xs gap-1.5 border-gray-200"
							>
								{pr.language}
							</Badge>
							<Badge
								variant="outline"
								className="text-xs capitalize border-gray-200"
							>
								{pr.status}
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
							onClick={() => handleLike(pr.id)}
						>
							<ThumbsUp
								className={`h-4 w-4 transition-transform duration-200 ${isLiked ? "fill-current scale-110" : ""}`}
							/>
							<span className="font-semibold tabular-nums">
								{pr.goods + (isLiked ? 1 : 0)}
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

export default PRCard;
