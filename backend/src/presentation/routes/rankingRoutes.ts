import { ErrorCode } from "@prnews/common";
import { Hono } from "hono";
import type { Dependencies } from "../../config/di";
import { respondError, respondSuccess } from "../../utils/apiResponder";

const rankingRoutes = new Hono<{ Variables: Dependencies }>();

rankingRoutes.get("/ranking/articles/likes", async (c) => {
	const { rankingService } = c.var;
	try {
		const period = c.req.query("period") as
			| "weekly"
			| "monthly"
			| "all"
			| undefined;
		const language = c.req.query("language") || undefined;
		const limit = c.req.query("limit")
			? Number(c.req.query("limit"))
			: undefined;
		const offset = c.req.query("offset")
			? Number(c.req.query("offset"))
			: undefined;
		const { data, totalItems } = await rankingService.getArticleLikeRanking({
			period,
			language,
			limit,
			offset,
		});
		return respondSuccess(c, {
			data,
			pagination: { totalItems, limit: limit ?? 10, offset: offset ?? 0 },
		});
	} catch (e) {
		console.error("/ranking/articles/likes error", e);
		return respondError(
			c,
			ErrorCode.INTERNAL_SERVER_ERROR,
			"ランキング取得に失敗しました",
		);
	}
});

export default rankingRoutes;
