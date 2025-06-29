"use client";

import { LoginForm } from "@/components/ui/loginform";
import { getAuth } from "@/lib/firebase";
import { GithubAuthProvider, signInWithPopup } from "firebase/auth";
import { useState } from "react";

export default function LoginPage() {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleGithubLogin = async () => {
		setIsLoading(true);
		setError(null);
		const auth = getAuth();
		const provider = new GithubAuthProvider();
		provider.addScope("repo");

		try {
			const result = await signInWithPopup(auth, provider);
			const firebaseToken = await result.user.getIdToken();

			const credential = GithubAuthProvider.credentialFromResult(result);
			if (!credential?.accessToken) {
				throw new Error(
					"GitHub access token could not be obtained from Firebase.",
				);
			}
			const githubAccessToken = credential.accessToken;

			const res = await fetch("http://localhost:8080/auth/login", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					firebaseToken,
					githubAccessToken,
				}),
				credentials: "include",
			});

			if (!res.ok) {
				const errorData = await res.json();
				throw new Error(errorData.message || "Failed to log in.");
			}
			window.location.href = "/home";
		} catch (err) {
			let message = "認証に失敗しました。";
			if (err instanceof Error) {
				message = err.message;
			}
			setError(message);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="flex min-h-screen w-full flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 p-6">
			<div className="w-full max-w-sm space-y-6">
				<LoginForm className="w-full" onGithubLogin={handleGithubLogin} />
				{isLoading && (
					<p className="text-center text-sm text-muted-foreground animate-pulse">
						認証中です...
					</p>
				)}
				{error && (
					<p className="text-center text-sm font-medium text-destructive">
						{error}
					</p>
				)}
			</div>
		</div>
	);
}
