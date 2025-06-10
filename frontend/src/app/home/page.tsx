import type { PR } from "@/features/routes/pr_list/components/PRCard";
import PRList from "@/features/routes/pr_list/components/PRList";
import React from "react";

// ダミーデータ
const weeklyPRs: PR[] = [
	{
		id: 1,
		title: "feat: Add dark mode support to the application",
		repository: "facebook/react",
		goods: 234,
		author: "johndoe",
		authorAvatar: "JD",
		createdAt: "2時間前",
		language: "TypeScript",
		status: "merged",
	},
	{
		id: 2,
		title: "fix: Resolve memory leak in useEffect cleanup",
		repository: "vercel/next.js",
		goods: 189,
		author: "janedoe",
		authorAvatar: "JD",
		createdAt: "5時間前",
		language: "JavaScript",
		status: "open",
	},
	{
		id: 3,
		title: "perf: Optimize bundle size by implementing tree shaking",
		repository: "vuejs/vue",
		goods: 167,
		author: "devuser",
		authorAvatar: "DU",
		createdAt: "1日前",
		language: "JavaScript",
		status: "merged",
	},
	{
		id: 4,
		title: "docs: Update README with better examples",
		repository: "microsoft/typescript",
		goods: 145,
		author: "contributor",
		authorAvatar: "CO",
		createdAt: "2日前",
		language: "Markdown",
		status: "open",
	},
];

const goodPRs: PR[] = [
	{
		id: 5,
		title: "refactor: Implement new design system components",
		repository: "tailwindlabs/tailwindcss",
		goods: 512,
		author: "designlead",
		authorAvatar: "DL",
		createdAt: "1週間前",
		language: "CSS",
		status: "merged",
	},
	{
		id: 6,
		title: "feat: Add AI-powered code suggestions",
		repository: "github/copilot",
		goods: 489,
		author: "aidev",
		authorAvatar: "AI",
		createdAt: "2週間前",
		language: "Python",
		status: "merged",
	},
	{
		id: 7,
		title: "fix: Critical security vulnerability patch",
		repository: "nodejs/node",
		goods: 456,
		author: "security-team",
		authorAvatar: "ST",
		createdAt: "1ヶ月前",
		language: "C++",
		status: "merged",
	},
];

const page = () => {
	return (
		<div>
			<PRList weeklyPRs={weeklyPRs} goodPRs={goodPRs} />
		</div>
	);
};

export default page;
