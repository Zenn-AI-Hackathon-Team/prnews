import {
	GoogleGenerativeAI,
	HarmBlockThreshold,
	HarmCategory,
} from "@google/generative-ai";
import type {
	Issue,
	IssueArticleContent,
	PrArticleContent,
} from "@prnews/common";
import { HTTPException } from "hono/http-exception";
import type { GeminiPort } from "../../ports/geminiPort";

/**
 * 'ja' -> 'Japanese' のように、プロンプトでAIに分かりやすい言語名に変換するヘルパー関数
 */
const getLanguageName = (code: string): string => {
	const langMap: Record<string, string> = {
		ja: "Japanese",
		en: "English",
		// 今後サポートする言語が増えたらここに追加する
	};
	return langMap[code] || "English"; // 不明なコードの場合は英語をデフォルトにする
};

// 環境変数からAPIキーを読み込む
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
	throw new HTTPException(500, {
		message: "GEMINI_API_KEY is not defined in environment variables",
	});
}

export const geminiClient = (): GeminiPort => {
	const genAI = new GoogleGenerativeAI(apiKey);

	const generationConfig = {
		responseMimeType: "application/json",
		temperature: 0.2,
	};

	const model = genAI.getGenerativeModel({
		model: "gemini-2.0-flash",
		generationConfig,
		safetySettings: [
			{
				category: HarmCategory.HARM_CATEGORY_HARASSMENT,
				threshold: HarmBlockThreshold.BLOCK_NONE,
			},
			{
				category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
				threshold: HarmBlockThreshold.BLOCK_NONE,
			},
			{
				category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
				threshold: HarmBlockThreshold.BLOCK_NONE,
			},
			{
				category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
				threshold: HarmBlockThreshold.BLOCK_NONE,
			},
		],
	});

	return {
		async summarizeDiff(inputTextForAI: string): Promise<PrArticleContent> {
			const language = "ja";
			const targetLanguage = getLanguageName(language);

			const prompt = `
                Your sole task is to act as a senior software engineer. Analyze the provided pull request data and return your analysis strictly as a single, valid JSON object.

                **CRITICAL RULES:**
                1.  Your entire response MUST be only the JSON object. Do not include any explanatory text, markdown fences (\"\"\"), or any other characters outside of the JSON structure.
                2.  All string values within the JSON object (e.g., titles, descriptions, points) MUST be written in the following language: **${targetLanguage}**.

                **JSON Structure and Content Rules:**
                - "aiGeneratedTitle": A catchy, concise title summarizing the PR. Max 80 characters.
                - "backgroundAndPurpose": A 2-3 sentence summary of the PR's background and purpose.
                - "mainChanges": An array of objects detailing the main file changes.
                    - "changeTypes": Must be a non-empty array containing one or more of the following strings: "FEAT", "FIX", "REFACTOR", "DOCS", "TEST", "PERF", "BUILD", "CHORE". If no other type fits, use ["CHORE"].
                - "notablePoints": An array of objects highlighting important aspects.
                    - "categories": Must be a non-empty array containing one or more of the following strings: "TECH", "RISK", "UX", "PERF", "SECURITY".
                    - If there are no notable points to mention, this field MUST be an empty array: "[]".

                **JSON Schema to adhere to:**
                \"\"\"json
                {
                  "aiGeneratedTitle": "string",
                  "backgroundAndPurpose": "string",
                  "mainChanges": [
                    {
                      "fileName": "string",
                      "changeTypes": ["FEAT" | "FIX" | "REFACTOR" | "DOCS" | "TEST" | "PERF" | "BUILD" | "CHORE"],
                      "description": "string"
                    }
                  ],
                  "notablePoints": [
                    {
                      "categories": ["TECH" | "RISK" | "UX" | "PERF" | "SECURITY"],
                      "point": "string"
                    }
                  ]
                }
                \"\"\"

                --- Pull Request Data to Analyze ---
                ${inputTextForAI}
            `;

			try {
				const result = await model.generateContent(prompt);
				const response = result.response;
				const jsonText = response.text();
				const parsed = JSON.parse(jsonText);

				return {
					aiGeneratedTitle: parsed.aiGeneratedTitle,
					backgroundAndPurpose: parsed.backgroundAndPurpose,
					mainChanges: parsed.mainChanges,
					notablePoints: parsed.notablePoints,
					summaryGeneratedAt: new Date().toISOString(),
					likeCount: 0,
				};
			} catch (error) {
				console.error("Gemini API request failed:", error);
				throw new HTTPException(500, {
					message: "Failed to generate summary with Gemini",
				});
			}
		},

		async summarizeIssue(issue: Issue): Promise<IssueArticleContent> {
			const language = "ja";
			const targetLanguage = getLanguageName(language);

			const inputTextForAI = `
GitHub Issue Title: ${issue.title}
Author: ${issue.author.login}
State: ${issue.state}
Created At: ${issue.githubIssueCreatedAt}
Labels: ${issue.labels.map((l) => l.name).join(", ") || "None"}

## Issue Body
${issue.body || "No description provided."}

## Comments
${issue.comments.map((c) => `### Comment by ${c.author?.login || "unknown"} at ${c.createdAt}\n${c.body}`).join("\n\n") || "No comments."}
`;

			const prompt = `
You are an expert software developer and technical writer tasked with summarizing a GitHub Issue.
Analyze the provided issue data and return your analysis strictly as a single, valid JSON object.

**CRITICAL RULES:**
1.  Your entire response MUST be only the JSON object. Do not include any explanatory text, markdown fences (\"\"\"), or any other characters outside of the JSON structure.
2.  All string values within the JSON object (e.g., titles, summaries) MUST be written in the following language: **${targetLanguage}**.

**JSON Structure and Content Rules:**
- "aiGeneratedTitle": A short, clear title that summarizes the core problem of the issue. Max 80 characters.
- "problemSummary": A 2-3 sentence summary of the problem reported in the issue body.
- "solutionSuggestion": Based on the entire discussion, summarize the most likely proposed or implemented solution. If no clear solution is discussed, state that the issue is still under investigation.
- "discussionPoints": An array of objects summarizing the key points from the comment thread. Focus on suggestions, key questions, and decisions. If there are no significant comments, this MUST be an empty array: []

**JSON Schema to adhere to:**
\"\"\"json
{
  "aiGeneratedTitle": "string",
  "problemSummary": "string",
  "solutionSuggestion": "string",
  "discussionPoints": [
    {
      "author": "string",
      "summary": "string"
    }
  ]
}
\"\"\"

--- GitHub Issue Data to Analyze ---
${inputTextForAI}
`;

			try {
				const result = await model.generateContent(prompt);
				const response = result.response;
				const jsonText = response.text();
				const parsed = JSON.parse(jsonText);

				return {
					aiGeneratedTitle: parsed.aiGeneratedTitle,
					problemSummary: parsed.problemSummary,
					solutionSuggestion: parsed.solutionSuggestion,
					discussionPoints: parsed.discussionPoints,
					summaryGeneratedAt: new Date().toISOString(),
					likeCount: 0,
				};
			} catch (error) {
				console.error(
					"Gemini API request failed for issue summarization:",
					error,
				);
				throw new HTTPException(500, {
					message: "Failed to generate issue summary with Gemini",
				});
			}
		},
	};
};
