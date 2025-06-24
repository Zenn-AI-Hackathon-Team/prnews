import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	/* config options here */
	output: "standalone",

	transpilePackages: ["@prnews/common", "@prnews/backend"],
};

export default nextConfig;
