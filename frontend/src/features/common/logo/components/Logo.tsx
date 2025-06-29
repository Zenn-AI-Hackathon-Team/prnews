import { GitPullRequest, Heart, Home } from "lucide-react";

// Props型定義
type LogoProps = {
	iconName: string;
};

const Logo: React.FC<LogoProps> = ({ iconName }) => {
	const iconItems = [
		{ id: "home", label: "Home", icon: Home },
		{
			id: "pr-issue",
			label: "PR and Issue",
			icon: GitPullRequest,
		},
		{ id: "favorites", label: "Favorites", icon: Heart },
	];
	const Icon = iconItems.find((item) => item.id === iconName)?.icon;
	if (!Icon) {
		console.error(`Icon with id "${iconName}" not found.`);
		return null;
	}
	return (
		<div className="flex items-center gap-3">
			<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-black-600/20">
				<Icon className="h-5 w-5" />
			</div>
			<span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
				{iconItems.find((item) => item.id === iconName)?.label}
			</span>
		</div>
	);
};

export default Logo;
