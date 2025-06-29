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
import { useAuth } from "@/context/AuthContext";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const UserMenu = () => {
	const { user, isLoading, revalidateUser } = useAuth();
	const router = useRouter();

	const getInitials = (name?: string | null) => {
		return name ? name.charAt(0).toUpperCase() : "U";
	};

	const handleLogout = async () => {
		try {
			const res = await fetch("http://localhost:8080/auth/logout", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
			});
			if (!res.ok) {
				const errorData = await res.json();
				throw new Error(errorData.message || "ログアウトに失敗しました。");
			}
			toast.success("ログアウトしました。");
			router.push("/");
		} catch (error) {
			console.error("Logout failed:", error);
			toast.error(
				error instanceof Error
					? error.message
					: "ログアウト中にエラーが発生しました。",
			);
		} finally {
			// 成功・失敗にかかわらずクライアントの認証状態を更新
			await revalidateUser();
		}
	};
	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" size="icon" className="relative">
						<Avatar className="h-8 w-8">
							<AvatarImage
								src={user?.avatarUrl ?? undefined}
								alt={user?.githubUsername ?? "ユーザー"}
							/>
							<AvatarFallback>
								{getInitials(user?.githubDisplayName || user?.githubUsername)}
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
							<DropdownMenuItem className="text-red-600" onClick={handleLogout}>
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
		</>
	);
};

export default UserMenu;
