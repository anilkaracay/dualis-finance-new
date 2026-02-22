/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: [
    ...require("./base").extends,
    "next/core-web-vitals",
  ],
  parser: require("./base").parser,
  plugins: [...require("./base").plugins],
  rules: {
    ...require("./base").rules,
  },
};
