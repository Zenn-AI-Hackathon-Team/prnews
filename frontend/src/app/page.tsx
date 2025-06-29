import { validateAuthCookie } from "@/features/common/functions/cookie/cookieCheck";
import { redirect } from "next/navigation";

export default async function Home() {
	const exitingCookie = await validateAuthCookie();
	if (exitingCookie) {
		redirect("/home");
	}

	return (
		<div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
			<main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
				<h1 className="text-2xl font-bold">PR-Newsへようこそ！</h1>
				<a href="/login" className="bg-primary text-white p-2 rounded">
					ログインしてください
				</a>
			</main>
		</div>
	);
}
