"use client";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell } from "lucide-react";

const Notification = () => {
	return (
		<>
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
							通知機能は現在開発中です。近日中にリリース予定です。
						</p>
					</DropdownMenuItem>
					<DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
						<p className="text-sm font-medium">トレンド更新</p>
						<p className="text-xs text-muted-foreground">
							トレンドキーワード機能は現在開発中です。近日中にリリース予定です。
						</p>
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</>
	);
};

export default Notification;
