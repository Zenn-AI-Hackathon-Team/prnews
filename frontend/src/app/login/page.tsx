"use client";

import { LoginForm } from "@/components/ui/loginform";
import { GithubAuthProvider, getAuth, signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const router = useRouter();

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

			// ★★★ 呼び出すAPIを新しい `/auth/login` に変更 ★★★
			const res = await fetch("http://localhost:8080/auth/login", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				// ★★★ 必要な情報をすべてbodyに含める ★★★
				body: JSON.stringify({
					firebaseToken,
					githubAccessToken,
				}),
			});

			if (!res.ok) {
				const errorData = await res.json();
				throw new Error(errorData.message || "Failed to log in.");
			}

			console.log("Login successful, redirecting to /home");
			router.push("/home");
		} catch (err) {
			console.error("Authentication failed:", err);
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
		<div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
			<div className="w-full max-w-sm">
				<LoginForm className="w-full" onGithubLogin={handleGithubLogin} />
				{isLoading && <p className="text-center mt-4">認証中...</p>}
				{error && <p className="text-red-500 text-center mt-4">{error}</p>}
			</div>
		</div>
	);
}
