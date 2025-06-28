"use client";
import type { User } from "@prnews/common";
import type { ReactNode } from "react";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";

// Contextで提供する値の型定義
interface AuthContextType {
	user: User | null;
	isLoading: boolean;
	revalidateUser: () => Promise<void>;
}

// Contextオブジェクトの作成
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// アプリケーション全体に認証情報を提供するProviderコンポーネント
export const AuthProvider = ({ children }: { children: ReactNode }) => {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true); // 初期表示時はロード中

	// ユーザー情報を再取得する関数
	const revalidateUser = useCallback(async () => {
		setIsLoading(true);
		try {
			// const res = await userClient.users.me.$get();
			const res = await fetch("http://localhost:8080/users/me", {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include", // Cookieを送信するために必須
			});

			if (res.ok) {
				// const data = await res.json();
				// setUser(data.data);
				const body: { success: boolean; data: User } = await res.json();
				setUser(body.data);
			} else {
				setUser(null);
			}
		} catch (error) {
			console.error("Failed to revalidate user:", error);
			setUser(null);
		} finally {
			setIsLoading(false);
		}
	}, []);

	// アプリケーションの初回読み込み時にユーザー情報を取得する
	useEffect(() => {
		revalidateUser();
	}, [revalidateUser]);

	return (
		<AuthContext.Provider value={{ user, isLoading, revalidateUser }}>
			{children}
		</AuthContext.Provider>
	);
};

// Contextを簡単に利用するためのカスタムフック
export const useAuth = () => {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
};
