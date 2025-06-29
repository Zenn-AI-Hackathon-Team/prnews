import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import Logo from "@/features/common/logo/components/Logo";
import { Github } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useAddFavoriteForm } from "../hooks";

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
				<Logo iconName="favorites" />
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
