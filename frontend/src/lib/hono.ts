import type { GeneralRoutesType } from "@prnews/backend/routes/generalRoutes";
import type { IssuePrivateRoutesType } from "@prnews/backend/routes/issuePrivateRoutes";
import type { IssuePublicRoutesType } from "@prnews/backend/routes/issuePublicRoutes";
import type { PrPrivateRoutesType } from "@prnews/backend/routes/prPrivateRoutes";
import type { PrPublicRoutesType } from "@prnews/backend/routes/prPublicRoutes";
import type { RankingRoutesType } from "@prnews/backend/routes/rankingRoutes";
import type { UserRoutesType } from "@prnews/backend/routes/userRoutes";
import { hc } from "hono/client";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export const rankingClient = hc<RankingRoutesType>(apiUrl);
export const prClient = hc<PrPublicRoutesType & PrPrivateRoutesType>(apiUrl);
export const issueClient = hc<IssuePublicRoutesType & IssuePrivateRoutesType>(
	apiUrl,
);
export const userClient = hc<UserRoutesType>(apiUrl);
export const generalClient = hc<GeneralRoutesType>(apiUrl);

export const client = hc<
	RankingRoutesType &
		PrPublicRoutesType &
		PrPrivateRoutesType &
		IssuePublicRoutesType &
		IssuePrivateRoutesType &
		UserRoutesType &
		GeneralRoutesType
>(apiUrl);
