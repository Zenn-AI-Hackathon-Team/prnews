import { Hono } from "hono";
import type { Dependencies } from "../../config/di";
import { respondSuccess } from "../../utils/apiResponder";

const generalRoutes = new Hono<{ Variables: Dependencies }>();

generalRoutes.get("/healthz", async (c) => {
	const { generalService } = c.var;
	try {
		const healthStatus = await generalService.checkHealth();
		return respondSuccess(c, healthStatus);
	} catch (error) {
		console.error("Health check failed:", error);
		return c.json(
			{ success: false, error: { code: "INTERNAL_SERVER_ERROR" } },
			500,
		);
	}
});

export default generalRoutes;
