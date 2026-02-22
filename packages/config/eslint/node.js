/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: [
    ...require("./base").extends,
    "plugin:node/recommended",
  ],
  parser: require("./base").parser,
  plugins: [...require("./base").plugins],
  rules: {
    ...require("./base").rules,
    "node/no-unsupported-features/es-syntax": [
      "error",
      { ignores: ["modules"] },
    ],
  },
};
