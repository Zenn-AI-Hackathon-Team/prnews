import type { GeneralRoutesType } from "@prnews/backend/routes/generalRoutes";
import type { IssuePrivateRoutesType } from "@prnews/backend/routes/issuePrivateRoutes";
import type { IssuePublicRoutesType } from "@prnews/backend/routes/issuePublicRoutes";
import type { PrPrivateRoutesType } from "@prnews/backend/routes/prPrivateRoutes";
import type { PrPublicRoutesType } from "@prnews/backend/routes/prPublicRoutes";
import type { RankingRoutesType } from "@prnews/backend/routes/rankingRoutes";
import type { UserPrivateRoutesType } from "@prnews/backend/routes/userPrivateRoutes";
import type { UserPublicRoutesType } from "@prnews/backend/routes/userPublicRoutes";
import { hc } from "hono/client";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// テスト用のトークン：ログイン機能ができるまではトークンを固定値で設定
const token = "hogehoge";

export const rankingClient = hc<RankingRoutesType>(apiUrl, {
	headers: {
		Authorization: `Bearer ${token}`,
	},
});
export const prClient = hc<PrPublicRoutesType & PrPrivateRoutesType>(apiUrl, {
	headers: {
		Authorization: `Bearer ${token}`,
	},
});
export const issueClient = hc<IssuePublicRoutesType & IssuePrivateRoutesType>(
	apiUrl,
	{
		headers: {
			Authorization: `Bearer ${token}`,
		},
	},
);
export const userClient = hc<UserPublicRoutesType & UserPrivateRoutesType>(
	apiUrl,
	{
		headers: {
			Authorization: `Bearer ${token}`,
		},
	},
);
export const generalClient = hc<GeneralRoutesType>(apiUrl, {
	headers: {
		Authorization: `Bearer ${token}`,
	},
});

export const client = hc<
	RankingRoutesType &
		PrPublicRoutesType &
		PrPrivateRoutesType &
		IssuePublicRoutesType &
		IssuePrivateRoutesType &
		UserPublicRoutesType &
		UserPrivateRoutesType &
		GeneralRoutesType
>(apiUrl);
