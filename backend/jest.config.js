module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.js", "**/*.test.js"],
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/server.js",
  ],
};
