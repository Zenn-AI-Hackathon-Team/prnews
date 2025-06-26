"use client";
import type { ErrorResponse } from "@prnews/common";
import { GithubAuthProvider, signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAuth } from "../lib/firebase";

export default function Home() {
	const [user, setUser] = useState<string | null>(null);
	const [error, setError] = useState<ErrorResponse | null>(null);
	const router = useRouter();

	useEffect(() => {
		async function signIn() {
			const url = window.location.search;
			const params = new URLSearchParams(url);
			const githubAccessToken = params.get("code");

			if (!githubAccessToken) return;

			const auth = getAuth();
			const provider = new GithubAuthProvider();

			try {
				const result = await signInWithPopup(auth, provider);
				const userData = result.user;
				const firebaseToken = await userData.getIdToken();
				console.log("firebaseToken", firebaseToken);

				// ★ バックエンドへのリクエストは /auth/token/exchange のみで完結
				const res = await fetch("http://localhost:8080/auth/token/exchange", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${firebaseToken}`,
					},
					body: JSON.stringify({
						githubAccessToken: `${githubAccessToken}`,
					}),
				});

				if (res.ok) {
					console.log("Login and session setup successful!");
					// ログイン成功後、ダッシュボードなどにリダイレクトする
					// 例: window.location.href = '/home';
					router.push("/home");
				} else {
					const errorData = await res.json();
					console.error("Authentication failed:", errorData);
					setError({
						message: errorData.message || res.statusText,
						code: String(res.status),
					});
				}
			} catch (e) {
				console.error("Firebase or network error:", e);

				// ★ 型ガードを使って安全にmessageプロパティにアクセスします
				let message = "An unexpected error occurred.";
				if (e instanceof Error) {
					message = e.message;
				}

				setError({ message: message, code: "CLIENT_ERROR" });
			}
		}
		signIn();
	}, [router]);

	if (error) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="text-red-500">
					<h2 className="text-xl font-bold mb-2">エラー</h2>
					<p>{error.message}</p>
					<p className="text-sm text-gray-500">{error.code}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
			<main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
				<div className="flex flex-col items-center justify-center min-h-[50vh]">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
					<p className="mt-4 text-gray-600">認証処理中...</p>
				</div>
			</main>
		</div>
	);
}
