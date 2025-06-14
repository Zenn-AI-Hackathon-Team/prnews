import { createRoute, z } from "@hono/zod-openapi";
import {
	errorResponseSchema,
	pullRequestArticleSchema,
	pullRequestListItemSchema,
	pullRequestSchema,
	successResponseSchema,
} from "@prnews/common";
import { HTTPException } from "hono/http-exception";
import { createApp } from "../hono-app";

// =============================
// 各ルートのスキーマ定義（既存定義をそのまま利用）
// =============================
const getPrRoute = createRoute({
	method: "get",
	path: "/repos/{owner}/{repo}/pulls/{number}",
	summary: "Pull Request情報の取得（キャッシュ）",
	description: `\
指定されたリポジトリ・PR番号のPull Request情報をキャッシュから取得します。
- DBにキャッシュがない場合は404。
`,
	tags: ["Pull Request"],
	request: {
		params: z.object({
			owner: z.string().openapi({
				param: { name: "owner", in: "path" },
				description: "リポジトリのオーナー名",
				example: "vercel",
			}),
			repo: z.string().openapi({
				param: { name: "repo", in: "path" },
				description: "リポジトリ名",
				example: "next.js",
			}),
			number: z
				.string()
				.regex(/^\d+$/)
				.transform(Number)
				.openapi({
					param: { name: "number", in: "path" },
					description: "Pull Requestの番号",
					example: "42",
				}),
		}),
	},
	responses: {
		200: {
			description: "取得成功",
			content: {
				"application/json": {
					schema: successResponseSchema(pullRequestSchema),
					example: {
						success: true,
						data: {
							prNumber: 42,
							repositoryFullName: "vercel/next.js",
							githubPrUrl: "https://github.com/vercel/next.js/pull/42",
							title: "Fix bug",
							body: "...",
							diff: "...",
							authorLogin: "masa",
							githubPrCreatedAt: "2024-01-01T00:00:00Z",
							comments: [],
						},
					},
				},
			},
		},
		404: {
			description: "指定されたPRがキャッシュに存在しない場合。",
			content: {
				"application/json": {
					schema: errorResponseSchema,
					example: {
						code: "HTTP_EXCEPTION",
						message: "Pull request not found in cache",
					},
				},
			},
		},
		500: {
			description: "サーバーエラー。DB障害など。",
			content: {
				"application/json": {
					schema: errorResponseSchema,
					example: {
						code: "INTERNAL_SERVER_ERROR",
						message: "Internal Server Error",
					},
				},
			},
		},
		422: {
			description:
				"パラメータバリデーションエラー（owner/repo/number不正など）",
			content: {
				"application/json": {
					schema: errorResponseSchema,
					example: {
						code: "VALIDATION_ERROR",
						message: "Validation Failed",
						details: [
							{
								code: "invalid_string",
								type: "string",
								path: ["owner"],
								message: "owner is required",
							},
						],
					},
				},
			},
		},
	},
});
const getArticleRoute = createRoute({
	method: "get",
	path: "/repos/{owner}/{repo}/pulls/{number}/article",
	summary: "Pull Request記事の取得",
	description: `\
指定されたリポジトリ・PR番号のPull Request記事を取得します。
- PRが存在しない場合や記事が未生成の場合は404。
`,
	tags: ["Pull Request"],
	request: {
		params: z.object({
			owner: z.string().openapi({
				param: { name: "owner", in: "path" },
				description: "リポジトリのオーナー名",
				example: "vercel",
			}),
			repo: z.string().openapi({
				param: { name: "repo", in: "path" },
				description: "リポジトリ名",
				example: "next.js",
			}),
			number: z
				.string()
				.regex(/^\d+$/)
				.transform(Number)
				.openapi({
					param: { name: "number", in: "path" },
					description: "Pull Requestの番号",
					example: "42",
				}),
		}),
	},
	responses: {
		200: {
			description: "記事取得成功",
			content: {
				"application/json": {
					schema: successResponseSchema(pullRequestArticleSchema),
					example: {
						success: true,
						data: {
							prNumber: 42,
							repositoryFullName: "vercel/next.js",
							githubPrUrl: "https://github.com/vercel/next.js/pull/42",
							title: "Added bundle size (manually for now)",
							body: "",
							diff: "diff --git a/Readme.md b/Readme.md\nindex efee4a94c292e..17702652bb1b2 100644\n--- a/Readme.md\n+++ b/Readme.md\n@@ -1,3 +1,3 @@\n- old line\n+ new line",
							authorLogin: "impronunciable",
							githubPrCreatedAt: "2025-06-11T15:16:09.267Z",
							comments: [],
							id: "e11bb909-e676-4b2b-9ea5-6ad523ea446c",
							totalLikeCount: 0,
							contents: {
								ja: {
									aiGeneratedTitle: "README.mdの整形と数値の更新",
									backgroundAndPurpose:
										"このプルリクエストは、README.mdファイルの整形と、バンドルサイズに関する数値情報を更新することを目的としています。",
									mainChanges: [
										{
											fileName: "Readme.md",
											changeTypes: ["DOCS"],
											description:
												"READMEファイルの整形と、バンドルサイズに関する数値情報の更新を行いました。",
										},
									],
									notablePoints: [],
									summaryGeneratedAt: "2025-06-11T15:16:09.267Z",
									likeCount: 0,
								},
							},
							createdAt: "2025-06-11T15:16:09.267Z",
							updatedAt: "2025-06-11T15:16:09.267Z",
						},
					},
				},
			},
		},
		404: {
			description: "指定されたPRまたは記事が存在しない場合。",
			content: {
				"application/json": {
					schema: errorResponseSchema,
					example: {
						code: "HTTP_EXCEPTION",
						message: "Article not found for this pull request",
					},
				},
			},
		},
		500: {
			description: "サーバーエラー。DB障害など。",
			content: {
				"application/json": {
					schema: errorResponseSchema,
					example: {
						code: "INTERNAL_SERVER_ERROR",
						message: "Internal Server Error",
					},
				},
			},
		},
		422: {
			description:
				"パラメータバリデーションエラー（owner/repo/number不正など）",
			content: {
				"application/json": {
					schema: errorResponseSchema,
					example: {
						code: "VALIDATION_ERROR",
						message: "Validation Failed",
						details: [
							{
								code: "invalid_string",
								type: "string",
								path: ["owner"],
								message: "owner is required",
							},
						],
					},
				},
			},
		},
	},
});
const ingestPrRoute = createRoute({
	method: "post",
	path: "/repos/{owner}/{repo}/pulls/{number}/ingest",
	summary: "GitHubからPull Request情報を取得・保存",
	description: `\
指定されたリポジトリのPull Request情報をGitHub APIから取得し、データベースに保存（取り込み）します。この処理はGitHub APIを消費します。
- 既に同じPRが存在する場合は上書き保存されます。
- 本APIは認証（Bearerトークン）が必須です。
`,
	tags: ["Pull Request"],
	request: {
		params: z.object({
			owner: z.string().openapi({
				param: { name: "owner", in: "path" },
				description: "リポジトリのオーナー名",
				example: "vercel",
			}),
			repo: z.string().openapi({
				param: { name: "repo", in: "path" },
				description: "リポジトリ名",
				example: "next.js",
			}),
			number: z
				.string()
				.regex(/^\d+$/)
				.transform(Number)
				.openapi({
					param: { name: "number", in: "path" },
					description: "Pull Requestの番号",
					example: "42",
				}),
		}),
	},
	responses: {
		200: {
			description: "Pull Request情報の取得・保存成功",
			content: {
				"application/json": {
					schema: successResponseSchema(pullRequestSchema),
					example: {
						success: true,
						data: {
							prNumber: 4183,
							repositoryFullName: "honojs/hono",
							githubPrUrl: "https://github.com/honojs/hono/pull/4183",
							title:
								"fix(utils/body): normalize key names in parseBody (#4108)",
							body: "### The author should do the following, if applicable\r\nFixes #4108 \r\n- [x]  Add tests\r\n- [x] Run tests\r\n- [x] `bun run format:fix && bun run lint:fix` to format the code\r\n- [ ] Add [TSDoc](https://tsdoc.org/)/[JSDoc](https://jsdoc.app/about-getting-started) to document the code\r\n",
							diff: "diff --git a/src/utils/body.test.ts b/src/utils/body.test.ts\nindex e9e54709a..d89209528 100644\n--- a/src/utils/body.test.ts\n+++ b/src/utils/body.test.ts\n@@ -244,6 +244,16 @@ describe('Parse Body Util', () => {\n     })\n   })\n \n+  it('should parse single value as array if the key has `[]`', async () => {\n+    const data = new FormData()\n+    data.append('foo[]', 'bar')\n+    const req = createRequest(FORM_URL, 'POST', data)\n+\n+    expect(await parseBody(req, { all: true })).toEqual({\n+      'foo[]': ['bar'],\n+    })\n+  })\n+\n   it('should return blank object if body is JSON', async () => {\n     const payload = { message: 'hello hono' }\n \ndiff --git a/src/utils/body.ts b/src/utils/body.ts\nindex de94080c3..3ce3375df 100644\n--- a/src/utils/body.ts\n+++ b/src/utils/body.ts\n@@ -188,7 +188,11 @@ const handleParsingAllValues = (\n       form[key] = [form[key] as string | File, value]\n     }\n   } else {\n-    form[key] = value\n+    if (!key.endsWith('[]')) {\n+      form[key] = value\n+    } else {\n+      form[key] = [value]\n+    }\n   }\n }\n \n",
							authorLogin: "hiroki-307",
							githubPrCreatedAt: "2025-06-01T00:35:48Z",
							comments: [
								{
									author: "codecov[bot]",
									body: "## [Codecov](https://app.codecov.io/gh/honojs/hono/pull/4183?dropdown=coverage&src=pr&el=h1&utm_medium=referral&utm_source=github&utm_content=comment&utm_campaign=pr+comments&utm_term=honojs) Report\nAll modified and coverable lines are covered by tests :white_check_mark:\n> Project coverage is 91.33%. Comparing base [(`4eb7979`)](https://app.codecov.io/gh/honojs/hono/commit/4eb7979e9b63208a09fd3c76b9bc76c0fdd22e19?dropdown=coverage&el=desc&utm_medium=referral&utm_source=github&utm_content=comment&utm_campaign=pr+comments&utm_term=honojs) to head [(`023726a`)](https://app.codecov.io/gh/honojs/hono/commit/023726a524f95604548f675ef3fa13f94f174d2f?dropdown=coverage&el=desc&utm_medium=referral&utm_source=github&utm_content=comment&utm_campaign=pr+comments&utm_term=honojs).\n> Report is 3 commits behind head on main.\n\n<details><summary>Additional details and impacted files</summary>\n\n\n```diff\n@@            Coverage Diff             @@\n##             main    #4183      +/-   ##\n==========================================\n+ Coverage   91.31%   91.33%   +0.02%     \n==========================================\n  Files         168      168              \n  Lines       10790    10806      +16     \n  Branches     3067     3094      +27     \n==========================================\n+ Hits         9853     9870      +17     \n+ Misses        936      935       -1     \n  Partials        1        1              \n```\n\n</details>\n\n[:umbrella: View full report in Codecov by Sentry](https://app.codecov.io/gh/honojs/hono/pull/4183?dropdown=coverage&src=pr&el=continue&utm_medium=referral&utm_source=github&utm_content=comment&utm_campaign=pr+comments&utm_term=honojs).   \n:loudspeaker: Have feedback on the report? [Share it here](https://about.codecov.io/codecov-pr-comment-feedback/?utm_medium=referral&utm_source=github&utm_content=comment&utm_campaign=pr+comments&utm_term=honojs).\n\n<details><summary> :rocket: New features to boost your workflow: </summary>\n\n- :snowflake: [Test Analytics](https://docs.codecov.com/docs/test-analytics): Detect flaky tests, report on failures, and find test suite problems.\n- :package: [JS Bundle Analysis](https://docs.codecov.com/docs/javascript-bundle-analysis): Save yourself from yourself by tracking and limiting bundle sizes in JS merges.\n</details>",
									createdAt: "2025-06-01T01:05:56Z",
								},
								{
									author: "yusukebe",
									body: "I think this test is wrong. We have to test the case where the value is single.\r\n\r\nIn my opinion, we should not strip `[]` because it prevents the introduction of breaking changes. So the ideal test is as follows:\r\n\r\n```ts\r\nit('should parse single value as array if the key has []', async () => {\r\n  const data = new FormData()\r\n  data.append('foo[]', 'bar')\r\n  const req = createRequest(FORM_URL, 'POST', data)\r\n  expect(await parseBody(req, { all: true })).toEqual({\r\n    'foo[]': ['bar'],\r\n  })\r\n})\r\n```\r\n\r\n@sor4chi What do you think of this?",
									createdAt: "2025-06-02T04:53:51Z",
								},
								{
									author: "sor4chi",
									body: 'Hi @yusukebe \r\nI think so.\r\nIn issue #4108, it appears that when the postfix is [], the return value is:\r\n\r\n- string | File when there is a single element\r\n- (string | File)[] when there are two or more elements\r\n\r\nHowever, the type is defined as `(string | File)[]`, which does not match the actual return value when there is only one element.\r\n<img width="893" alt="Screenshot 2025-06-02 at 14 51 14" src="https://github.com/user-attachments/assets/f3bdaaba-1950-4848-bbda-bcd73380b3b4" />\r\n',
									createdAt: "2025-06-02T05:58:18Z",
								},
								{
									author: "hiroki-307",
									body: "I've updated the code to always return an array when the key ends with ```[]```, and added a corresponding test.\r\nAlso fixed the test key name (was file, now reflects the actual case).\r\n\r\nDo we need a test for when the value is a File and the key ends with ```[]```?",
									createdAt: "2025-06-02T13:58:48Z",
								},
								{
									author: "yusukebe",
									body: "I think you don't need to change the name of the key. You can keep `file` as is.",
									createdAt: "2025-06-02T22:09:48Z",
								},
								{
									author: "yusukebe",
									body: "Thanks @hiroki-307, it's almost good. I commented.\r\n\r\n@sor4chi Can you also review this?",
									createdAt: "2025-06-02T22:10:54Z",
								},
								{
									author: "sor4chi",
									body: "```suggestion\r\n  it('should parse single value as array if the key has `[]`', async () => {\r\n```\r\nnit",
									createdAt: "2025-06-04T01:38:20Z",
								},
								{
									author: "yusukebe",
									body: "Hi @hiroki-307 !\r\n\r\nLooks good to me! I'll merge it and include the next minor version (since the behavior has changed slightly). Thank you for your contribution.",
									createdAt: "2025-06-06T23:37:21Z",
								},
							],
						},
					},
				},
			},
		},
		401: {
			description: "認証エラー。Bearerトークンが無効または未指定。",
			content: {
				"application/json": {
					schema: errorResponseSchema,
					example: { code: "HTTP_EXCEPTION", message: "Unauthenticated" },
				},
			},
		},
		404: {
			description: "指定されたPRがGitHub上に存在しない場合。",
			content: {
				"application/json": {
					schema: errorResponseSchema,
					example: { code: "HTTP_EXCEPTION", message: "PRが見つかりません" },
				},
			},
		},
		422: {
			description:
				"パラメータバリデーションエラー（owner/repo/number不正など）",
			content: {
				"application/json": {
					schema: errorResponseSchema,
					example: {
						code: "VALIDATION_ERROR",
						message: "Validation Failed",
						details: [
							{
								code: "invalid_string",
								type: "string",
								path: ["owner"],
								message: "owner is required",
							},
						],
					},
				},
			},
		},
	},
	security: [{ bearerAuth: [] }],
});
const generateArticleRoute = createRoute({
	method: "post",
	path: "/repos/{owner}/{repo}/pulls/{number}/article",
	summary: "Pull Request記事のAI自動生成",
	description: `\
指定されたリポジトリ・PR番号のPull Request記事をAIで自動生成します。
- 既に記事が存在する場合は上書き生成されます。
- 本APIは認証（Bearerトークン）が必須です。
`,
	tags: ["Pull Request"],

	request: {
		params: z.object({
			owner: z.string().openapi({
				param: { name: "owner", in: "path" },
				description: "リポジトリのオーナー名",
				example: "vercel",
			}),
			repo: z.string().openapi({
				param: { name: "repo", in: "path" },
				description: "リポジトリ名",
				example: "next.js",
			}),
			number: z
				.string()
				.regex(/^\d+$/)
				.transform(Number)
				.openapi({
					param: { name: "number", in: "path" },
					description: "Pull Requestの番号",
					example: "42",
				}),
		}),
	},
	responses: {
		200: {
			description: "記事生成成功",
			content: {
				"application/json": {
					schema: successResponseSchema(pullRequestArticleSchema),
					example: {
						success: true,
						data: {
							prNumber: 4183,
							repositoryFullName: "honojs/hono",
							githubPrUrl: "https://github.com/honojs/hono/pull/4183",
							title:
								"fix(utils/body): normalize key names in parseBody (#4108)",
							body: "### The author should do the following, if applicable\r\nFixes #4108 \r\n- [x]  Add tests\r\n- [x] Run tests\r\n- [x] `bun run format:fix && bun run lint:fix` to format the code\r\n- [ ] Add [TSDoc](https://tsdoc.org/)/[JSDoc](https://jsdoc.app/about-getting-started) to document the code\r\n",
							diff: "diff --git a/src/utils/body.test.ts b/src/utils/body.test.ts\nindex e9e54709a..d89209528 100644\n--- a/src/utils/body.test.ts\n+++ b/src/utils/body.test.ts\n@@ -244,6 +244,16 @@ describe('Parse Body Util', () => {\n     })\n   })\n \n+  it('should parse single value as array if the key has `[]`', async () => {\n+    const data = new FormData()\n+    data.append('foo[]', 'bar')\n+    const req = createRequest(FORM_URL, 'POST', data)\n+\n+    expect(await parseBody(req, { all: true })).toEqual({\n+      'foo[]': ['bar'],\n+    })\n+  })\n+\n   it('should return blank object if body is JSON', async () => {\n     const payload = { message: 'hello hono' }\n \ndiff --git a/src/utils/body.ts b/src/utils/body.ts\nindex de94080c3..3ce3375df 100644\n--- a/src/utils/body.ts\n+++ b/src/utils/body.ts\n@@ -188,7 +188,11 @@ const handleParsingAllValues = (\n       form[key] = [form[key] as string | File, value]\n     }\n   } else {\n-    form[key] = value\n+    if (!key.endsWith('[]')) {\n+      form[key] = value\n+    } else {\n+      form[key] = [value]\n+    }\n   }\n }\n \n",
							authorLogin: "hiroki-307",
							githubPrCreatedAt: "2025-06-01T00:35:48Z",
							comments: [
								{
									author: "codecov[bot]",
									body: "## [Codecov](https://app.codecov.io/gh/honojs/hono/pull/4183?dropdown=coverage&src=pr&el=h1&utm_medium=referral&utm_source=github&utm_content=comment&utm_campaign=pr+comments&utm_term=honojs) Report\nAll modified and coverable lines are covered by tests :white_check_mark:\n> Project coverage is 91.33%. Comparing base [(`4eb7979`)](https://app.codecov.io/gh/honojs/hono/commit/4eb7979e9b63208a09fd3c76b9bc76c0fdd22e19?dropdown=coverage&el=desc&utm_medium=referral&utm_source=github&utm_content=comment&utm_campaign=pr+comments&utm_term=honojs) to head [(`023726a`)](https://app.codecov.io/gh/honojs/hono/commit/023726a524f95604548f675ef3fa13f94f174d2f?dropdown=coverage&el=desc&utm_medium=referral&utm_source=github&utm_content=comment&utm_campaign=pr+comments&utm_term=honojs).\n> Report is 3 commits behind head on main.\n\n<details><summary>Additional details and impacted files</summary>\n\n\n```diff\n@@            Coverage Diff             @@\n##             main    #4183      +/-   ##\n==========================================\n+ Coverage   91.31%   91.33%   +0.02%     \n==========================================\n  Files         168      168              \n  Lines       10790    10806      +16     \n  Branches     3067     3094      +27     \n==========================================\n+ Hits         9853     9870      +17     \n+ Misses        936      935       -1     \n  Partials        1        1              \n```\n\n</details>\n\n[:umbrella: View full report in Codecov by Sentry](https://app.codecov.io/gh/honojs/hono/pull/4183?dropdown=coverage&src=pr&el=continue&utm_medium=referral&utm_source=github&utm_content=comment&utm_campaign=pr+comments&utm_term=honojs).   \n:loudspeaker: Have feedback on the report? [Share it here](https://about.codecov.io/codecov-pr-comment-feedback/?utm_medium=referral&utm_source=github&utm_content=comment&utm_campaign=pr+comments&utm_term=honojs).\n\n<details><summary> :rocket: New features to boost your workflow: </summary>\n\n- :snowflake: [Test Analytics](https://docs.codecov.com/docs/test-analytics): Detect flaky tests, report on failures, and find test suite problems.\n- :package: [JS Bundle Analysis](https://docs.codecov.com/docs/javascript-bundle-analysis): Save yourself from yourself by tracking and limiting bundle sizes in JS merges.\n</details>",
									createdAt: "2025-06-01T01:05:56Z",
								},
								{
									author: "yusukebe",
									body: "I think this test is wrong. We have to test the case where the value is single.\r\n\r\nIn my opinion, we should not strip `[]` because it prevents the introduction of breaking changes. So the ideal test is as follows:\r\n\r\n```ts\r\nit('should parse single value as array if the key has []', async () => {\r\n  const data = new FormData()\r\n  data.append('foo[]', 'bar')\r\n  const req = createRequest(FORM_URL, 'POST', data)\r\n  expect(await parseBody(req, { all: true })).toEqual({\r\n    'foo[]': ['bar'],\r\n  })\r\n})\r\n```\r\n\r\n@sor4chi What do you think of this?",
									createdAt: "2025-06-02T04:53:51Z",
								},
								{
									author: "sor4chi",
									body: 'Hi @yusukebe \r\nI think so.\r\nIn issue #4108, it appears that when the postfix is [], the return value is:\r\n\r\n- string | File when there is a single element\r\n- (string | File)[] when there are two or more elements\r\n\r\nHowever, the type is defined as `(string | File)[]`, which does not match the actual return value when there is only one element.\r\n<img width="893" alt="Screenshot 2025-06-02 at 14 51 14" src="https://github.com/user-attachments/assets/f3bdaaba-1950-4848-bbda-bcd73380b3b4" />\r\n',
									createdAt: "2025-06-02T05:58:18Z",
								},
								{
									author: "hiroki-307",
									body: "I've updated the code to always return an array when the key ends with ```[]```, and added a corresponding test.\r\nAlso fixed the test key name (was file, now reflects the actual case).\r\n\r\nDo we need a test for when the value is a File and the key ends with ```[]```?",
									createdAt: "2025-06-02T13:58:48Z",
								},
								{
									author: "yusukebe",
									body: "I think you don't need to change the name of the key. You can keep `file` as is.",
									createdAt: "2025-06-02T22:09:48Z",
								},
								{
									author: "yusukebe",
									body: "Thanks @hiroki-307, it's almost good. I commented.\r\n\r\n@sor4chi Can you also review this?",
									createdAt: "2025-06-02T22:10:54Z",
								},
								{
									author: "sor4chi",
									body: "```suggestion\r\n  it('should parse single value as array if the key has `[]`', async () => {\r\n```\r\nnit",
									createdAt: "2025-06-04T01:38:20Z",
								},
								{
									author: "yusukebe",
									body: "Hi @hiroki-307 !\r\n\r\nLooks good to me! I'll merge it and include the next minor version (since the behavior has changed slightly). Thank you for your contribution.",
									createdAt: "2025-06-06T23:37:21Z",
								},
							],
							id: "df206a62-acc5-4453-8c46-0d03cdd2b9fa",
							totalLikeCount: 0,
							contents: {
								ja: {
									aiGeneratedTitle:
										"フォームデータ解析の改善：単一値を配列として処理",
									backgroundAndPurpose:
										"このPRは、フォームデータの解析処理を改善し、キーが`[]`で終わる場合に単一の値を配列として扱うように修正します。これにより、#4108の問題を解決し、一貫性のあるデータ構造を提供します。",
									mainChanges: [
										{
											fileName: "src/utils/body.ts",
											changeTypes: ["FIX"],
											description:
												"キーが`[]`で終わる場合に、フォームデータを配列として解析するように修正しました。",
										},
										{
											fileName: "src/utils/body.test.ts",
											changeTypes: ["TEST", "FIX"],
											description:
												"キーが`[]`で終わる場合のフォームデータ解析のテストを追加し、テストケースを修正しました。",
										},
									],
									notablePoints: [
										{
											categories: ["TECH"],
											point:
												"キーが`[]`で終わる場合、常に配列を返すように変更し、データ構造の一貫性を確保しました。",
										},
									],
									summaryGeneratedAt: "2025-06-12T19:27:36.058Z",
									likeCount: 0,
								},
							},
							createdAt: "2025-06-12T19:27:36.058Z",
							updatedAt: "2025-06-12T19:27:36.058Z",
						},
					},
				},
			},
		},
		404: {
			description: "PRまたは記事が見つからない場合。",
			content: {
				"application/json": {
					schema: errorResponseSchema,
					example: {
						code: "HTTP_EXCEPTION",
						message: "PRまたは記事が見つかりません",
					},
				},
			},
		},
		500: {
			description: "サーバーエラー。AI生成処理失敗など。",
			content: {
				"application/json": {
					schema: errorResponseSchema,
					example: {
						code: "INTERNAL_SERVER_ERROR",
						message: "Internal Server Error",
					},
				},
			},
		},
		422: {
			description:
				"パラメータバリデーションエラー（owner/repo/number不正など）",
			content: {
				"application/json": {
					schema: errorResponseSchema,
					example: {
						code: "VALIDATION_ERROR",
						message: "Validation Failed",
						details: [
							{
								code: "invalid_string",
								type: "string",
								path: ["owner"],
								message: "owner is required",
							},
						],
					},
				},
			},
		},
	},
	security: [{ bearerAuth: [] }],
});
const listRepoPullsRoute = createRoute({
	method: "get",
	path: "/repos/{owner}/{repo}/pulls",
	summary: "リポジトリのプルリクエスト一覧を取得",
	description: `\
指定されたリポジトリのPR一覧を、解説記事の有無と合わせて取得します。
- PRの状態（open/closed/all）やページネーションも指定可能。
- 本APIは認証（Bearerトークン）が必須です。
`,
	tags: ["Pull Request"],

	request: {
		params: z.object({
			owner: z.string().openapi({
				param: { name: "owner", in: "path" },
				description: "リポジトリのオーナー名",
				example: "masa-massara",
			}),
			repo: z.string().openapi({
				param: { name: "repo", in: "path" },
				description: "リポジトリ名",
				example: "NotiPal",
			}),
		}),
		query: z.object({
			state: z.enum(["open", "closed", "all"]).optional().openapi({
				description: "PRの状態（open/closed/all）",
				example: "open",
			}),
			per_page: z.string().optional().transform(Number).openapi({
				description: "1ページあたりの件数",
				example: "20",
			}),
			page: z.string().optional().transform(Number).openapi({
				description: "ページ番号",
				example: "1",
			}),
		}),
	},
	responses: {
		200: {
			description: "PR一覧の取得成功",
			content: {
				"application/json": {
					schema: successResponseSchema(z.array(pullRequestListItemSchema)),
					example: {
						success: true,
						data: [
							{
								prNumber: 1,
								title: "Add feature",
								authorLogin: "masa",
								githubPrUrl: "https://github.com/masa-massara/NotiPal/pull/1",
								state: "open",
								createdAt: "2024-01-01T00:00:00Z",
								articleExists: true,
							},
						],
					},
				},
			},
		},
		404: {
			description: "指定されたリポジトリが存在しない場合。",
			content: {
				"application/json": {
					schema: errorResponseSchema,
					example: { code: "HTTP_EXCEPTION", message: "Repository not found" },
				},
			},
		},
		500: {
			description: "サーバーエラー。DB障害など。",
			content: {
				"application/json": {
					schema: errorResponseSchema,
					example: {
						code: "INTERNAL_SERVER_ERROR",
						message: "Internal Server Error",
					},
				},
			},
		},
		422: {
			description: "パラメータバリデーションエラー（owner/repo不正など）",
			content: {
				"application/json": {
					schema: errorResponseSchema,
					example: {
						code: "VALIDATION_ERROR",
						message: "Validation Failed",
						details: [
							{
								code: "invalid_string",
								type: "string",
								path: ["owner"],
								message: "owner is required",
							},
						],
					},
				},
			},
		},
	},
	security: [{ bearerAuth: [] }],
});
const likeResponseSchema = z.object({
	likeCount: z.number().int().nonnegative(),
	message: z.string(),
});
const likeArticleRoute = createRoute({
	method: "post",
	path: "/articles/{articleId}/language/{langCode}/like",
	summary: "AI解説記事の特定言語版に「いいね」を付与",
	description: `\
指定されたAI解説記事（Pull Request記事）の特定言語版（例: 日本語 "ja"）に「いいね」を付けます。
- すでに同じユーザーが同じ記事・言語にいいね済みの場合はlikeCountのみ返します（副作用なし）。
- 記事または言語版が存在しない場合は404エラー。
- 本APIは認証（Bearerトークン）が必須です。
`,
	tags: ["Likes"],

	request: {
		params: z.object({
			articleId: z
				.string()
				.min(1)
				.openapi({
					param: { name: "articleId", in: "path" },
					description: "対象AI解説記事のID（UUID形式推奨）",
					example: "11111111-1111-1111-1111-111111111111",
				}),
			langCode: z
				.string()
				.length(2)
				.openapi({
					param: { name: "langCode", in: "path" },
					description: "言語コード（2文字、例: 'ja', 'en'）",
					example: "ja",
				}),
		}),
	},
	responses: {
		201: {
			description: "新規でいいねした場合。likeCountは1増加。",
			content: {
				"application/json": {
					schema: successResponseSchema(likeResponseSchema),
					example: {
						success: true,
						data: { likeCount: 5, message: "いいねしました" },
					},
				},
			},
		},
		200: {
			description: "既にいいね済みの場合。likeCountは変化しない。",
			content: {
				"application/json": {
					schema: successResponseSchema(likeResponseSchema),
					example: {
						success: true,
						data: { likeCount: 5, message: "既にいいね済みです" },
					},
				},
			},
		},
		401: {
			description: "認証エラー。Bearerトークンが無効または未指定。",
			content: {
				"application/json": {
					schema: errorResponseSchema,
					example: { code: "HTTP_EXCEPTION", message: "Unauthenticated" },
				},
			},
		},
		404: {
			description: "指定された記事または言語版が存在しない場合。",
			content: {
				"application/json": {
					schema: errorResponseSchema,
					example: {
						code: "HTTP_EXCEPTION",
						message: "指定された記事または言語版が見つかりません。",
					},
				},
			},
		},
		422: {
			description:
				"パラメータバリデーションエラー（articleId/言語コード不正など）",
			content: {
				"application/json": {
					schema: errorResponseSchema,
					example: {
						code: "VALIDATION_ERROR",
						message: "Validation Failed",
						details: [
							{
								code: "too_small",
								minimum: 1,
								type: "string",
								path: ["articleId"],
								message: "String must contain at least 1 character(s)",
							},
						],
					},
				},
			},
		},
	},
	security: [{ bearerAuth: [] }],
});

const prPrivateRoutes = createApp()
	.openapi(ingestPrRoute, async (c) => {
		const { prService } = c.var;
		const user = c.var.user;
		if (!user) throw new HTTPException(401, { message: "Unauthenticated" });
		const params = c.req.valid("param");
		const ingestedPr = await prService.ingestPr(
			user.id,
			params.owner,
			params.repo,
			params.number,
		);
		const parsed = pullRequestSchema.parse(ingestedPr);
		return c.json({ success: true as const, data: parsed }, 200);
	})
	.openapi(listRepoPullsRoute, async (c) => {
		const { prService } = c.var;
		const user = c.var.user;
		if (!user) throw new HTTPException(401, { message: "Unauthenticated" });
		const { owner, repo } = c.req.valid("param");
		const query = c.req.valid("query");
		const prList = await prService.getPullRequestListForRepo(
			user.id,
			owner,
			repo,
			query,
		);
		const parsed = pullRequestListItemSchema.array().parse(prList);
		return c.json({ success: true as const, data: parsed }, 200);
	})
	.openapi(likeArticleRoute, async (c) => {
		const { prService } = c.var;
		const user = c.var.user;
		if (!user) throw new HTTPException(401, { message: "Unauthenticated" });
		const { articleId, langCode } = c.req.valid("param");
		const result = await prService.likeArticle(user.id, articleId, langCode);
		const responseData = likeResponseSchema.parse({
			likeCount: result.likeCount,
			message: result.message,
		});
		if (result.alreadyLiked)
			return c.json({ success: true as const, data: responseData }, 200);
		return c.json({ success: true as const, data: responseData }, 201);
	})
	.openapi(generateArticleRoute, async (c) => {
		const { prService } = c.var;
		const user = c.var.user;
		if (!user) throw new HTTPException(401, { message: "Unauthenticated" });
		const params = c.req.valid("param");
		const article = await prService.generateArticle(
			params.owner,
			params.repo,
			params.number,
		);
		const parsed = pullRequestArticleSchema.parse(article);
		return c.json({ success: true as const, data: parsed }, 200);
	});

export type PrPrivateRoutesType = typeof prPrivateRoutes;

export default prPrivateRoutes;
