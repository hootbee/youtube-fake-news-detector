module.exports = {
  testEnvironment: "node",
  testTimeout: 60000,
  moduleDirectories: ["node_modules", "src"],
  roots: ["<rootDir>/src"],
  testMatch: ["**/tests/**/*.test.js"],

  verbose: true,
  setupFiles: ["<rootDir>/jest.setup.js"],
};
