import type { GeneralRoutesType } from "@prnews/backend/routes/generalRoutes";
import type { IssueRoutesType } from "@prnews/backend/routes/issueRoutes";
import type { PrRoutesType } from "@prnews/backend/routes/prRoutes";
import type { RankingRoutesType } from "@prnews/backend/routes/rankingRoutes";
import type { UserRoutesType } from "@prnews/backend/routes/userRoutes";
import { hc } from "hono/client";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export const rankingClient = hc<RankingRoutesType>(apiUrl);
export const prClient = hc<PrRoutesType>(apiUrl);
export const issueClient = hc<IssueRoutesType>(apiUrl);
export const userClient = hc<UserRoutesType>(apiUrl);
export const generalClient = hc<GeneralRoutesType>(apiUrl);
