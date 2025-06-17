"use client";
import type { newPR } from "@/app/pr/page";
import { Badge } from "@/components/ui/badge";
import { GitPullRequest } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const NewPRCard = ({ pr }: { pr: newPR }) => {
	const [authorAvatar, setAuthorAvatar] = useState<string>("");
	const [repositoryFullName, setRepositoryFullName] = useState<string>("");

	const author = pr.owner;
	const repoName = pr.repo;

	// アバターイニシャルを生成
	const getAvatarInitials = (author: string) => {
		return author.slice(0, 2).toUpperCase();
	};

	const createRepositoryFullName = (owner: string, repo: string) => {
		return `${owner}/${repo}`;
	};

	if (author && repoName) {
		setAuthorAvatar(getAvatarInitials(author));
		setRepositoryFullName(createRepositoryFullName(author, repoName));
	}

	return (
		<Link href={`/article/${pr.prNumber}`}>
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
									{authorAvatar}
								</div>
							</div>
							<div>
								<div className="flex items-center gap-2">
									<span className="text-sm font-medium text-gray-900">
										@{author}
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
				</div>

				{/* Hover Accent */}
				<div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
			</div>
		</Link>
	);
};

export default NewPRCard;
