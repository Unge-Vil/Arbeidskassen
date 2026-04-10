const { resolve } = require("node:path");

const project = resolve(process.cwd(), "tsconfig.json");

/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@next/next/recommended",
    "plugin:jsx-a11y/recommended",
    "plugin:tailwindcss/recommended",
    "prettier",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project,
  },
  env: {
    browser: true,
    node: true,
    es2022: true,
  },
  ignorePatterns: [".next/", "node_modules/", "dist/"],
  rules: {
    "@typescript-eslint/no-unused-vars": [
      "error",
      { argsIgnorePattern: "^_" },
    ],
    // Force usage of --ak-* tokens instead of generic colors
    "tailwindcss/no-custom-classname": "off",
    "no-restricted-syntax": [
      "error",
      {
        "selector": "Literal[value=/bg-(gray|red|blue|green|yellow|purple|indigo|pink|teal|orange|slate|zinc|neutral|stone)-[1-9]00/]",
        "message": "Do not use standard Tailwind background colors. Use background design tokens like bg-[var(--ak-bg-main)] or bg-[var(--ak-accent)]."
      },
      {
        "selector": "Literal[value=/text-(gray|red|blue|green|yellow|purple|indigo|pink|teal|orange|slate|zinc|neutral|stone)-[1-9]00/]",
        "message": "Do not use standard Tailwind text colors. Use text design tokens like text-[var(--ak-text-main)] or text-[var(--ak-text-muted)]."
      }
    ]
  },
};
