import {
	GoogleGenerativeAI,
	HarmBlockThreshold,
	HarmCategory,
} from "@google/generative-ai";
import type { GeminiPort } from "../../ports/geminiPort";

// 環境変数からAPIキーを読み込む
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
	throw new Error("GEMINI_API_KEY is not defined in environment variables");
}

export const geminiClient = (): GeminiPort => {
	const genAI = new GoogleGenerativeAI(apiKey);

	const generationConfig = {
		// responseMimeTypeに'application/json'を指定するとJSONモードになる
		responseMimeType: "application/json",
		temperature: 0.2, // 出力のランダム性を少し下げる
	};

	const model = genAI.getGenerativeModel({
		model: "gemini-1.5-flash",
		generationConfig, // ここで設定をモデルに適用
		// 安全設定（今回はデバッグしやすいように一旦OFFに）
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
			// プロンプトも、より明確な指示に改善しよう（次のセクションで解説）
			const prompt = `
                あなたの唯一のタスクは、シニアソフトウェアエンジニアとして提供されたプルリクエストの情報を分析し、分析結果をJSONオブジェクトとして返すことです。
                説明文、Markdown、その他JSONオブジェクト以外のテキストは一切含めないでください。

                以下のルールに厳密に従ってください:
                - "mainChanges"の"changeTypes"には、必ず["FEAT", "FIX", "REFACTOR", "DOCS", "TEST", "PERF", "BUILD", "CHORE"]のいずれか1つ以上を含めてください。該当しない場合は["CHORE"]としてください。
                - "notablePoints"の"categories"には、必ず["TECH", "RISK", "UX", "PERF", "SECURITY"]のいずれか1つ以上を含めてください。
                - もし"notablePoints"に該当する情報がない場合は、空の配列[]を返してください。

                返すべきJSONの構造:
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

                --- 分析対象のプルリクエスト情報 ---
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
				throw new Error("Failed to generate summary with Gemini");
			}
		},
	};
};
