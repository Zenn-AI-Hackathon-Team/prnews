"use client";

import { LoginForm } from "@/components/ui/loginform";
import { GithubAuthProvider, signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getAuth } from "../../lib/firebase";

export default function LoginPage() {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const router = useRouter();

	const handleGithubLogin = async () => {
		setIsLoading(true);
		setError(null);
		const auth = getAuth();
		const provider = new GithubAuthProvider();

		try {
			// 1. Firebase Authでポップアップサインインを実行
			const result = await signInWithPopup(auth, provider);
			const firebaseToken = await result.user.getIdToken();

			// 2. バックエンドのセッション作成エンドポイントを呼び出す
			const res = await fetch("http://localhost:8080/auth/session/create", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ firebaseToken }),
			});

			if (!res.ok) {
				const errorData = await res.json();
				throw new Error(errorData.message || "Failed to create session.");
			}

			// 3. 認証とセッション作成が成功したら、ホームページなどにリダイレクト
			console.log("Authentication successful, redirecting to /home");
			router.push("/home"); // ログイン後のページ（例: /home）に遷移
		} catch (err) {
			console.error("Authentication failed:", err);
			let message = "認証に失敗しました。時間をおいて再試行してください。";
			if (err instanceof Error) {
				message = err.message;
			}
			setError(message);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
			<div className="w-full max-w-sm">
				<LoginForm className="w-full" onGithubLogin={handleGithubLogin} />
				{isLoading && <p className="text-center mt-4">認証中...</p>}
				{error && <p className="text-red-500 text-center mt-4">{error}</p>}
			</div>
		</div>
	);
}
