import type { Context, Hono, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import { createApp } from "../hono-app";
import generalRoutes from "./generalRoutes";

describe("/healthz endpoint", () => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let app: Hono<{ Variables: TestVariables }>;
	const mockCheckHealth = jest.fn();
	const mockGeneralService = { checkHealth: mockCheckHealth };
	type TestVariables = { generalService: typeof mockGeneralService };

	let errorSpy: jest.SpyInstance;
	beforeEach(() => {
		app = createApp<TestVariables>();
		app.onError((err: unknown, c: Context<{ Variables: TestVariables }>) => {
			if (err instanceof HTTPException) {
				return c.json(
					{ code: "HTTP_EXCEPTION", message: err.message },
					err.status,
				);
			}
			return c.json(
				{ code: "INTERNAL_SERVER_ERROR", message: "Internal Server Error" },
				500,
			);
		});
		app.use(
			"*",
			async (c: Context<{ Variables: TestVariables }>, next: Next) => {
				c.set("generalService", mockGeneralService);
				await next();
			},
		);
		app.route("/", generalRoutes);
		errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
	});
	afterEach(() => {
		errorSpy.mockRestore();
	});

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
		mockCheckHealth.mockRejectedValue(
			new HTTPException(500, { message: "DB connection failed" }),
		);
		const req = new Request("http://localhost/healthz");
		const res = await app.request(req);
		expect(res.status).toBe(500);
		const json = await res.json();
		expect(json.code).toBe("HTTP_EXCEPTION");
		expect(json.message).toBe("DB connection failed");
	});
});
