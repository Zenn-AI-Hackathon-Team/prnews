import type { GeneralRoutesType } from "@prnews/backend/routes/generalRoutes";
import type { IssuePrivateRoutesType } from "@prnews/backend/routes/issuePrivateRoutes";
import type { IssuePublicRoutesType } from "@prnews/backend/routes/issuePublicRoutes";
import type { PrPrivateRoutesType } from "@prnews/backend/routes/prPrivateRoutes";
import type { PrPublicRoutesType } from "@prnews/backend/routes/prPublicRoutes";
import type { RankingRoutesType } from "@prnews/backend/routes/rankingRoutes";
import type { UserPrivateRoutesType } from "@prnews/backend/routes/userPrivateRoutes";
import type { UserPublicRoutesType } from "@prnews/backend/routes/userPublicRoutes";
import type { AppType } from "@prnews/backend/rpc";
import { hc } from "hono/client";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const customFetch: typeof fetch = async (input, init) => {
	const headers = new Headers(init?.headers);

	if (typeof window === "undefined") {
		try {
			const { cookies } = await import("next/headers");
			const cookieStore = await cookies();
			const authToken = cookieStore.get("auth-token");

			if (authToken) {
				headers.set("Cookie", `auth-token=${authToken.value}`);
			}
		} catch (error) {}
	}

	const newInit: RequestInit = {
		...init,
		headers,
		credentials: "include",
	};

	return fetch(input, newInit);
};

export const client = hc<AppType>(apiUrl, {
	fetch: customFetch,
});

export const generalClient = hc<GeneralRoutesType>(apiUrl, {
	fetch: customFetch,
});

export const rankingClient = hc<RankingRoutesType>(apiUrl, {
	fetch: customFetch,
});

export const prClient = hc<PrPublicRoutesType & PrPrivateRoutesType>(apiUrl, {
	fetch: customFetch,
});

export const issueClient = hc<IssuePublicRoutesType & IssuePrivateRoutesType>(
	apiUrl,
	{
		fetch: customFetch,
	},
);

export const userClient = hc<UserPublicRoutesType & UserPrivateRoutesType>(
	apiUrl,
	{
		fetch: customFetch,
	},
);
