import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const ArticleSearch = () => {
	return (
		<>
			<div className="flex flex-1 max-w-md mx-8">
				<div className="relative w-full">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						type="search"
						placeholder="検索機能は現在開発中です。近日中にリリース予定です。"
						className="w-full pl-10 pr-4 h-10 bg-muted/50 border-none focus:bg-background transition-colors"
					/>
				</div>
			</div>
		</>
	);
};

export default ArticleSearch;
