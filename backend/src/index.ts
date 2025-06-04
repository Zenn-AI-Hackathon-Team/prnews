import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { type Dependencies, buildDependencies } from "./config/di";
import generalRoutes from "./presentation/routes/generalRoutes";
import prRoutes from "./presentation/routes/prRoutes";

const app = new Hono<{ Variables: Dependencies }>();

app.use("*", async (c, next) => {
	const deps = buildDependencies();
	c.set("github", deps.github);
	c.set("gemini", deps.gemini);
	c.set("prRepo", deps.prRepo);
	c.set("generalService", deps.generalService);
	c.set("prService", deps.prService);
	await next();
});

app.route("/", generalRoutes);
app.route("/", prRoutes);

serve(
	{
		fetch: app.fetch,
		port: 8080,
	},
	(info) => {
		console.log(`Server is running on http://localhost:${info.port}`);
	},
);
