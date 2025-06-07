import { Hono } from "hono";
import { createGeneralService } from "../../application/generalService";
import { respondSuccess } from "../../utils/apiResponder";
import generalRoutes from "./generalRoutes";

describe("/healthz endpoint", () => {
	const mockCheckHealth = jest.fn();
	const mockGeneralService = { checkHealth: mockCheckHealth };

	type TestVariables = { generalService: typeof mockGeneralService };
	const app = new Hono<{ Variables: TestVariables }>();

	// DI変数をセットするミドルウェア
	app.use("*", async (c, next) => {
		c.set("generalService", mockGeneralService);
		await next();
	});
	app.route("/", generalRoutes);

	it("正常系: ok: trueを返す", async () => {
		mockCheckHealth.mockResolvedValue({ ok: true });
		const req = new Request("http://localhost/healthz");
		const res = await app.request(req);
		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json.success).toBe(true);
		expect(json.data).toEqual({ ok: true });
	});

	it("異常系: checkHealthがthrowした場合500", async () => {
		mockCheckHealth.mockRejectedValue(new Error("fail"));
		const req = new Request("http://localhost/healthz");
		const res = await app.request(req);
		expect(res.status).toBe(500);
		const json = await res.json();
		expect(json.success).toBe(false);
		expect(json.error.code).toBe("INTERNAL_SERVER_ERROR");
	});
});
