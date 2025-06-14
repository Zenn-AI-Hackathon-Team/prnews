import { createRoute, z } from "@hono/zod-openapi";
import {
	errorResponseSchema,
	pullRequestArticleSchema,
	pullRequestSchema,
	successResponseSchema,
} from "@prnews/common";
import { HTTPException } from "hono/http-exception";
import { createApp } from "../hono-app";

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
							prNumber: 4183,
							repositoryFullName: "honojs/hono",
							githubPrUrl: "https://github.com/honojs/hono/pull/4183",
							title:
								"fix(utils/body): normalize key names in parseBody (#4108)",
							body: "### The author should do the following, if applicable\r\nFixes #4108 \r\n- [x]  Add tests\r\n- [x] Run tests\r\n- [x] `bun run format:fix && bun run lint:fix` to format the code\r\n- [ ] Add [TSDoc](https://tsdoc.org/)/[JSDoc](https://jsdoc.app/about-getting-started) to document the code\r\n",
							diff: "diff --git a/src/utils/body.test.ts b/src/utils/body.test.ts\nindex e9e54709a..d89209528 100644\n--- a/src/utils/body.test.ts\n+++ b/src/utils/body.test.ts\n@@ -244,6 +244,16 @@ describe('Parse Body Util', () => {\n     })\n   })\n \n+  it('should parse single value as array if the key has `[]`', async () => {\n+    const data = new FormData()\n+    data.append('foo[]', 'bar')\n+    const req = createRequest(FORM_URL, 'POST', data)\n+\n+    expect(await parseBody(req, { all: true })).toEqual({\n+      'foo[]': ['bar'],\n+    })\n+  })\n+\n   it('should return blank object if body is JSON', async () => {\n     const payload = { message: 'hello hono' }\n \ndiff --git a/src/utils/body.ts b/src/utils/body.ts\nindex de94080c3..3ce3375df 100644\n--- a/src/utils/body.ts\n+++ b/src/utils/body.ts\n@@ -188,7 +188,11 @@ const handleParsingAllValues = (\n       form[key] = [form[key] as string | File, value]\n     }\n   } else {\n-    form[key] = value\n+    if (!key.endsWith('[]')) {\n+      form[key] = value\n+    } else {\n+      form[key] = [value]\n+    }\n   }\n }\n \n",
							authorLogin: "hiroki-307",
							githubPrCreatedAt: "2025-06-12T19:27:36.058Z",
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
							prNumber: 4183,
							repositoryFullName: "honojs/hono",
							githubPrUrl: "https://github.com/honojs/hono/pull/4183",
							title:
								"fix(utils/body): normalize key names in parseBody (#4108)",
							body: "### The author should do the following, if applicable\r\nFixes #4108 \r\n- [x]  Add tests\r\n- [x] Run tests\r\n- [x] `bun run format:fix && bun run lint:fix` to format the code\r\n- [ ] Add [TSDoc](https://tsdoc.org/)/[JSDoc](https://jsdoc.app/about-getting-started) to document the code\r\n",
							diff: "diff --git a/src/utils/body.test.ts b/src/utils/body.test.ts\nindex e9e54709a..d89209528 100644\n--- a/src/utils/body.test.ts\n+++ b/src/utils/body.test.ts\n@@ -244,6 +244,16 @@ describe('Parse Body Util', () => {\n     })\n   })\n \n+  it('should parse single value as array if the key has `[]`', async () => {\n+    const data = new FormData()\n+    data.append('foo[]', 'bar')\n+    const req = createRequest(FORM_URL, 'POST', data)\n+\n+    expect(await parseBody(req, { all: true })).toEqual({\n+      'foo[]': ['bar'],\n+    })\n+  })\n+\n   it('should return blank object if body is JSON', async () => {\n     const payload = { message: 'hello hono' }\n \ndiff --git a/src/utils/body.ts b/src/utils/body.ts\nindex de94080c3..3ce3375df 100644\n--- a/src/utils/body.ts\n+++ b/src/utils/body.ts\n@@ -188,7 +188,11 @@ const handleParsingAllValues = (\n       form[key] = [form[key] as string | File, value]\n     }\n   } else {\n-    form[key] = value\n+    if (!key.endsWith('[]')) {\n+      form[key] = value\n+    } else {\n+      form[key] = [value]\n+    }\n   }\n }\n \n",
							authorLogin: "hiroki-307",
							githubPrCreatedAt: "2025-06-12T19:27:36.058Z",
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

const prPublicRoutes = createApp()
	.openapi(getPrRoute, async (c) => {
		const { prService } = c.var;
		const params = c.req.valid("param");
		const pr = await prService.getPullRequest(
			params.owner,
			params.repo,
			params.number,
		);
		if (!pr)
			throw new HTTPException(404, {
				message: "Pull request not found in cache",
			});
		const parsed = pullRequestSchema.parse(pr);
		return c.json({ success: true as const, data: parsed }, 200);
	})
	.openapi(getArticleRoute, async (c) => {
		const { prService, prRepo } = c.var;
		const params = c.req.valid("param");
		const pullRequest = await prRepo.findByOwnerRepoNumber(
			params.owner,
			params.repo,
			params.number,
		);
		if (!pullRequest)
			throw new HTTPException(404, {
				message: "Original pull request not found",
			});
		const prId = pullRequest.id;
		const article = await prService.getArticle(prId);
		if (!article)
			throw new HTTPException(404, {
				message: "Article not found for this pull request",
			});
		const parsed = pullRequestArticleSchema.parse(article);
		return c.json({ success: true as const, data: parsed }, 200);
	});

export type PrPublicRoutesType = typeof prPublicRoutes;
export default prPublicRoutes;
