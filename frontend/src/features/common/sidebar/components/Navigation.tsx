"use client";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger } from "@/components/ui/tooltip";
import { GitPullRequest, Heart, Home, Settings } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const menuItems = [
	{ id: "home", label: "Home", icon: Home, path: "/" },
	{
		id: "pr-issue",
		label: "PR and Issue",
		icon: GitPullRequest,
		path: "/pr-issue",
	},
	{ id: "favorites", label: "Favorites", icon: Heart, path: "/favorites" },
	{ id: "settings", label: "Settings", icon: Settings, path: "/settings" },
];

const Navigation = () => {
	const [activeItem, setActiveItem] = useState("home");
	return (
		<nav className="flex-1 p-4 space-y-2">
			{menuItems.map((item) => {
				const Icon = item.icon;
				const isActive = activeItem === item.id;

				return (
					<Tooltip key={item.id}>
						<TooltipTrigger asChild>
							<Link href={item.path} className="block">
								<Button
									variant={isActive ? "secondary" : "ghost"}
									className="w-full justify-start relative"
									onClick={() => setActiveItem(item.id)}
								>
									<Icon className="h-5 w-5" />
									<span className="font-medium">{item.label}</span>
									{isActive && (
										<div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full -ml-4" />
									)}
								</Button>
							</Link>
						</TooltipTrigger>
					</Tooltip>
				);
			})}
		</nav>
	);
};

export default Navigation;
