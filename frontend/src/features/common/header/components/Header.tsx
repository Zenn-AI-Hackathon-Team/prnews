"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { Bell, LogOut, Search } from "lucide-react";
import Logo from "../../logo/components/Logo";

const Header = () => {
	const { user, isLoading } = useAuth();
	const getInitials = (name?: string | null) => {
		return name ? name.charAt(0).toUpperCase() : "U";
	};

	return (
		<header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="container mx-auto px-4">
				<div className="flex h-16 items-center justify-between">
					{/* Left section - Logo */}
					<Logo iconName="" />
					{/* Center section - Search */}
					<div className="flex flex-1 max-w-md mx-8">
						<div className="relative w-full">
							<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								type="search"
								placeholder="ニュースを検索..."
								className="w-full pl-10 pr-4 h-10 bg-muted/50 border-none focus:bg-background transition-colors"
							/>
						</div>
					</div>

					{/* Right section - Actions */}
					<div className="flex items-center gap-2">
						{/* Mobile search button */}
						<Button variant="ghost" size="icon" className="md:hidden">
							<Search className="h-5 w-5" />
							<span className="sr-only">検索</span>
						</Button>

						{/* Notifications */}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="icon" className="relative">
									<Bell className="h-5 w-5" />
									<span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
									<span className="sr-only">通知</span>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-80">
								<DropdownMenuLabel>通知</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
									<p className="text-sm font-medium">新着ニュース</p>
									<p className="text-xs text-muted-foreground">
										AI関連の最新ニュースが3件あります
									</p>
								</DropdownMenuItem>
								<DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
									<p className="text-sm font-medium">トレンド更新</p>
									<p className="text-xs text-muted-foreground">
										今週のトレンドキーワードが更新されました
									</p>
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>

						{/* User menu */}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="icon" className="relative">
									<Avatar className="h-8 w-8">
										<AvatarImage
											src={user?.avatarUrl ?? undefined}
											alt={user?.githubUsername ?? "ユーザー"}
										/>
										<AvatarFallback>
											{getInitials(
												user?.githubDisplayName || user?.githubUsername,
											)}
										</AvatarFallback>
									</Avatar>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-56">
								{isLoading ? (
									<DropdownMenuLabel>読み込み中...</DropdownMenuLabel>
								) : user ? (
									<>
										<DropdownMenuLabel>
											<p className="font-semibold text-gray-900">
												{user.githubDisplayName || user.githubUsername}
											</p>
											<p className="text-sm text-gray-600">{user.email}</p>
										</DropdownMenuLabel>
										<DropdownMenuSeparator />
										{/* ... メニュー項目 ... */}
										<DropdownMenuItem className="text-red-600">
											<LogOut className="h-4 w-4 text-red-600" />
											ログアウト
										</DropdownMenuItem>
									</>
								) : (
									<DropdownMenuItem>
										<a href="/login">ログイン</a>
									</DropdownMenuItem>
								)}
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>
			</div>
		</header>
	);
};

export default Header;
