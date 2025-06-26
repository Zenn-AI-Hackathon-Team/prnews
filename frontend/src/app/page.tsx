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

			const auth = getAuth();
			const provider = new GithubAuthProvider();

			try {
				const result = await signInWithPopup(auth, provider);
				const userData = result.user;
				const firebaseToken = await userData.getIdToken();
				console.log("firebaseToken", firebaseToken);

				// 1. GitHubアクセストークンを保存
				const tokenExchangeRes = await fetch(
					"http://localhost:8080/auth/token/exchange",
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							Authorization: `Bearer ${firebaseToken}`,
						},
						body: JSON.stringify({
							githubAccessToken: `${githubAccessToken}`,
						}),
					},
				);

				if (!tokenExchangeRes.ok) {
					throw new Error("Token exchange failed");
				}

				// 2. サインアップ
				const signupRes = await fetch("http://localhost:8080/auth/signup", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${firebaseToken}`,
					},
					body: JSON.stringify({
						language: "ja",
					}),
				});

				// 3. セッション作成（Cookie設定）
				const sessionRes = await fetch(
					"http://localhost:8080/auth/session/create",
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						credentials: "include", // Cookieを送受信するために必要
						body: JSON.stringify({
							firebaseToken: firebaseToken,
						}),
					},
				);

				if (sessionRes.ok) {
					const sessionData = await sessionRes.json();
					console.log("Session created:", sessionData);

					// セッション作成成功後、ホームページへリダイレクト
					router.push("/home");
				} else {
					throw new Error("Session creation failed");
				}
			} catch (error) {
				console.error("Authentication error:", error);
				setError({
					message:
						error instanceof Error ? error.message : "Authentication failed",
					code: "AUTH_ERROR",
				});
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
