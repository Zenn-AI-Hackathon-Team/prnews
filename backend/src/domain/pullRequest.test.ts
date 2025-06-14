import { createPullRequest } from "./pullRequest";
import type { PullRequest } from "./pullRequest";

describe("createPullRequest", () => {
	it("propsで渡した値が正しくPullRequestオブジェクトに反映される", () => {
		const props: PullRequest = {
			id: "pr-id-001",
			prNumber: 123,
			repository: "test-owner/test-repo",
			title: "Implement new feature",
			body: "This PR implements a new feature.",
			diff: "diff --git a/file.txt b/file.txt",
			authorLogin: "test-user",
			createdAt: new Date().toISOString(),
			comments: [
				{
					author: "reviewer1",
					body: "Looks good!",
					createdAt: new Date().toISOString(),
				},
			],
		};

		const pullRequest = createPullRequest(props);

		expect(pullRequest).toEqual(props);
		// 各プロパティも個別に確認
		expect(pullRequest.id).toBe(props.id);
		expect(pullRequest.prNumber).toBe(props.prNumber);
		expect(pullRequest.repository).toBe(props.repository);
		expect(pullRequest.title).toBe(props.title);
		expect(pullRequest.body).toBe(props.body);
		expect(pullRequest.diff).toBe(props.diff);
		expect(pullRequest.authorLogin).toBe(props.authorLogin);
		expect(pullRequest.createdAt).toBe(props.createdAt);
		expect(pullRequest.comments).toEqual(props.comments);
	});
});
