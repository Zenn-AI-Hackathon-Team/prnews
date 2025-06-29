import Notification from "@/features/routes/notifications/components/Notification";
import ArticleSearch from "@/features/routes/search/components/ArticleSearch";
import UserMenu from "@/features/routes/user_menu/components/UserMenu";
import Logo from "../../logo/components/Logo";

const Header = () => {
	return (
		<header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="container mx-auto px-4">
				<div className="flex h-16 items-center justify-between">
					{/* Left section - Logo */}
					<Logo iconName="" />
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
