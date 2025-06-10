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
	moduleNameMapper: {
		// ESMを使ってる場合、ts-jestが推奨する設定を追加
		"^(\\.{1,2}/.*)\\.js$": "$1",
		// 元々あったpathsの設定はそのまま活かす
		...pathsToModuleNameMapper(tsconfig.compilerOptions.paths || {}, {
			prefix: "<rootDir>/",
		}),
	},
	transform: {
		"^.+\\.tsx?$": [
			"ts-jest",
			{
				useESM: true,
				tsconfig: "./tsconfig.jest.json",
			},
		],
	},
	moduleFileExtensions: ["ts", "js", "json"],
	testMatch: ["<rootDir>/src/**/*.test.ts"],
	setupFiles: ["dotenv/config"],
};
