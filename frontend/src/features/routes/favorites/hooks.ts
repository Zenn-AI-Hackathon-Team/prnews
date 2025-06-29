import { userClient } from "@/lib/hono";
import type { ErrorResponse, FavoriteRepository } from "@prnews/common";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export const useFavorites = () => {
	const [favorites, setFavorites] = useState<FavoriteRepository[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// お気に入りを取得するための関数
	const getFavoriteRepos = useCallback(async () => {
		setIsLoading(true);
		setError(null);

		try {
			const response = await userClient.users.me["favorite-repositories"].$get({
				query: { limit: "20", offset: "0" },
			});

			if (!response.ok) {
				const errorData: ErrorResponse = await response.json();
				throw new Error(errorData.message || "お気に入りの取得に失敗しました");
			}

			const result = await response.json();
			setFavorites(result.data.data);
		} catch (err) {
			console.error("Failed to fetch favorites:", err);
			setError(
				err instanceof Error ? err.message : "予期せぬエラーが発生しました",
			);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		getFavoriteRepos();
	}, [getFavoriteRepos]);

	// お気に入りを削除するための関数
	const deleteFavoriteRepo = useCallback(
		async (owner: string, repo: string) => {
			// UIを即時反映させるため、先にStateから削除（Optimistic Update）
			const originalFavorites = favorites;
			const repoFullName = `${owner}/${repo}`;
			setFavorites((prev) => prev.filter((fav) => fav.repo !== repoFullName));

			try {
				const response = await userClient.users.me["favorite-repositories"][
					":owner"
				][":repo"].$delete({
					param: { owner, repo },
				});

				if (!response.ok) {
					const errorData: ErrorResponse = await response.json();
					throw new Error(errorData.message || "削除に失敗しました。");
				}

				toast.success(`「${repo}」をお気に入りから削除しました。`);
				await getFavoriteRepos();
			} catch (err) {
				// エラーが発生した場合は、UIを元に戻す
				setFavorites(originalFavorites);
				toast.error(
					err instanceof Error ? err.message : "予期せぬエラーが発生しました。",
				);
			}
		},
		[favorites, getFavoriteRepos],
	);

	return {
		favorites,
		isLoading,
		error,
		refetch: getFavoriteRepos,
		onDelete: deleteFavoriteRepo,
	};
};

type UseAddFavoriteFormProps = {
	onSuccess: () => void;
};

export const useAddFavoriteForm = ({ onSuccess }: UseAddFavoriteFormProps) => {
	const [isLoading, setIsLoading] = useState(false);

	// GitHubのURLから owner と repo を抽出する関数
	const parseGitHubUrl = (
		inputUrl: string,
	): { owner: string; repo: string } | null => {
		try {
			// URL形式 (https://github.com/owner/repo) と短縮形式 (owner/repo) の両方に対応
			const urlPattern = /github\.com\/([^\/]+)\/([^\/]+)/;
			const shortPattern = /^([^\/]+)\/([^\/]+)$/;

			const urlMatch = inputUrl.match(urlPattern);
			if (urlMatch?.[1] && urlMatch[2]) {
				return { owner: urlMatch[1], repo: urlMatch[2].replace(/\.git$/, "") };
			}

			const shortMatch = inputUrl.match(shortPattern);
			if (shortMatch?.[1] && shortMatch[2]) {
				return {
					owner: shortMatch[1],
					repo: shortMatch[2].replace(/\.git$/, ""),
				};
			}

			return null;
		} catch {
			return null;
		}
	};

	// お気に入りを追加するための関数
	const addFavoriteRepo = async (url: string) => {
		const repoInfo = parseGitHubUrl(url);
		if (!repoInfo) {
			toast.error("無効なGitHubリポジトリURLです。", {
				description: "例: https://github.com/vercel/next.js",
			});
			return;
		}

		setIsLoading(true);
		try {
			const response = await userClient.users.me["favorite-repositories"].$post(
				{ json: repoInfo },
			);

			if (!response.ok) {
				const errorData: ErrorResponse = await response.json();
				throw new Error(
					errorData.message || "リポジトリの追加に失敗しました。",
				);
			}

			const result = await response.json();
			const statusMessage =
				response.status === 201
					? "をお気に入りに追加しました！"
					: "は既にお気に入り登録済みです。";
			toast.success(`「${result.data.repo}」${statusMessage}`);
			onSuccess(); // 親に成功を通知
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "予期せぬエラーが発生しました。",
			);
		} finally {
			setIsLoading(false);
		}
	};

	return { isLoading, onAdd: addFavoriteRepo };
};
