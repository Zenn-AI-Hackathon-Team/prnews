import { userClient } from "@/lib/hono";
import { cookies } from "next/headers";

/**
 * サーバーサイドで認証Cookieの有効性をチェックします。
 * @returns {Promise<boolean>} 認証が有効な場合は `true`、無効な場合は `false` を返します。
 */
export const validateAuthCookie = async (): Promise<boolean> => {
	// 1. サーバーサイドでCookieストアを取得
	const cookieStore = await cookies();
	const authToken = cookieStore.get("auth-token");

	// 2. Cookieが存在しない場合は認証無効
	if (!authToken) {
		return false;
	}

	// 3. Cookieが存在する場合、セッションが有効かバックエンドに問い合わせて検証
	try {
		const res = await userClient.users.me.$get();

		// 4. APIが成功を返せば認証有効、そうでなければ無効
		return res.ok;
	} catch (error) {
		console.error("Auth validation request failed:", error);
		return false;
	}
};
