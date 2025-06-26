import { Github, Heart } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useAddFavoriteForm } from "../hooks";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";

type AddFavoriteFormProps = {
	refetch: () => void;
};

const AddFavoriteForm: React.FC<AddFavoriteFormProps> = ({ refetch }) => {
	const [url, setUrl] = useState("");

	const { isLoading, onAdd } = useAddFavoriteForm({
		onSuccess: () => {
			setUrl(""); // 成功時にURL入力欄をクリア
			refetch(); // 親コンポーネントに通知
		},
	});

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		onAdd(url);
	};

	return (
		<>
			{/* Header */}
			<div className="space-y-3">
				<div className="flex items-center gap-3">
					<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-black-600/20">
						<Heart className="h-5 w-5" />
					</div>
					<span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
						お気に入り
					</span>
					<Badge variant="secondary" className="ml-1">
						NEW
					</Badge>
				</div>
				<p className="text-gray-600 text-lg mb-6">
					お気に入りライブラリを追加して、最新のプルリクエストをチェックしましょう
				</p>
			</div>

			{/* Form */}
			<form onSubmit={handleSubmit}>
				<div className="relative flex items-center gap-3">
					<div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
						<Github className="h-6 w-6" />
					</div>
					<Input
						value={url}
						onChange={(e) => setUrl(e.target.value)}
						placeholder="githubのURLをコピペして入力"
						className="flex-1 pl-12 h-12 text-lg bg-muted/40 border-2 border-primary/30 focus:border-primary/60 focus:bg-white transition-all shadow-sm"
					/>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								type="submit"
								variant="default"
								size="lg"
								className="h-12 px-8 text-lg font-bold shadow-md"
								disabled={isLoading || !url}
							>
								追加
							</Button>
						</TooltipTrigger>
						<TooltipContent sideOffset={8}>
							<span>GitHubリポジトリURLを追加</span>
						</TooltipContent>
					</Tooltip>
				</div>
			</form>
		</>
	);
};

export default AddFavoriteForm;
