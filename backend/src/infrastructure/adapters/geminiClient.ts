import {
	GoogleGenerativeAI,
	HarmBlockThreshold,
	HarmCategory,
} from "@google/generative-ai";
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
		model: "gemini-1.5-flash",
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
		async summarizeDiff(inputTextForAI: string) {
			const language = "ja";
			const targetLanguage = getLanguageName(language);

			const prompt = `
                Your sole task is to act as a senior software engineer. Analyze the provided pull request data and return your analysis strictly as a single, valid JSON object.

                **CRITICAL RULES:**
                1.  Your entire response MUST be only the JSON object. Do not include any explanatory text, markdown fences (\`\`\`), or any other characters outside of the JSON structure.
                2.  All string values within the JSON object (e.g., titles, descriptions, points) MUST be written in the following language: **${targetLanguage}**.

                **JSON Structure and Content Rules:**
                - "aiGeneratedTitle": A catchy, concise title summarizing the PR. Max 80 characters.
                - "backgroundAndPurpose": A 2-3 sentence summary of the PR's background and purpose.
                - "mainChanges": An array of objects detailing the main file changes.
                    - "changeTypes": Must be a non-empty array containing one or more of the following strings: "FEAT", "FIX", "REFACTOR", "DOCS", "TEST", "PERF", "BUILD", "CHORE". If no other type fits, use ["CHORE"].
                - "notablePoints": An array of objects highlighting important aspects.
                    - "categories": Must be a non-empty array containing one or more of the following strings: "TECH", "RISK", "UX", "PERF", "SECURITY".
                    - If there are no notable points to mention, this field MUST be an empty array: \`[]\`.

                **JSON Schema to adhere to:**
                \`\`\`json
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
                \`\`\`

                --- Pull Request Data to Analyze ---
                ${inputTextForAI}
            `;

			try {
				const result = await model.generateContent(prompt);
				const response = result.response;
				const jsonText = response.text();
				const parsed = JSON.parse(jsonText);

				return {
					...parsed,
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
	};
};
