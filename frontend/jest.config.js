const path = require("path");

/** @type {import('jest').Config} */
module.exports = {
  rootDir: path.resolve(__dirname),
  testEnvironment: "jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  setupFilesAfterEnv: [path.resolve(__dirname, "jest.setup.js")],
  modulePathIgnorePatterns: ["<rootDir>/.next/"],
  testMatch: ["**/__tests__/**/*.test.ts?(x)"],
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: "tsconfig.jest.json" }],
  },
};
