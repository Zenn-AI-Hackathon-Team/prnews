import Notification from "@/features/routes/notifications/components/Notification";
import ArticleSearch from "@/features/routes/search/components/ArticleSearch";
import UserMenu from "@/features/routes/user_menu/components/UserMenu";

const Header = () => {
	return (
		<header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="container mx-auto px-4">
				<div className="flex h-16 items-center justify-between">
					{/* Left section - Logo */}
					<div className="flex items-center gap-3">
						<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-black-600/20">
							<img src={"/PRNews.png"} alt="app icon" className="h-9 w-9" />
						</div>
						<span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
							PRNews
						</span>
					</div>
					{/* Center section - Search */}
					<ArticleSearch />
					{/* Right section - Actions */}
					<div className="flex items-center gap-2">
						<Notification />
						<UserMenu />
					</div>
				</div>
			</div>
		</header>
	);
};

export default Header;
