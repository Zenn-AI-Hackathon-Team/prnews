const { pathsToModuleNameMapper } = require("ts-jest");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");

const tsconfig = JSON.parse(
	readFileSync(resolve(__dirname, "./tsconfig.json"), "utf8"),
);

module.exports = {
	preset: "ts-jest/presets/default-esm",
	testEnvironment: "node",
	extensionsToTreatAsEsm: [".ts"],
	globals: {
		"ts-jest": {
			useESM: true,
			tsconfig: "./tsconfig.jest.json",
		},
	},
	moduleNameMapper: pathsToModuleNameMapper(
		tsconfig.compilerOptions.paths || {},
		{ prefix: "<rootDir>/" },
	),
	moduleFileExtensions: ["ts", "js", "json"],
	testMatch: ["<rootDir>/src/**/*.test.ts"],
	transform: {},
	setupFiles: ["dotenv/config"],
};
