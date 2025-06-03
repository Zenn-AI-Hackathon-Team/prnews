export type PullRequest = {
	id: string;
	prNumber: number;
	repository: string;
	title: string;
	diff: string;
	authorLogin: string;
	createdAt: string;
};

export const createPullRequest = (
	props: Omit<PullRequest, "id">,
): PullRequest => ({
	id: crypto.randomUUID(),
	...props,
});
