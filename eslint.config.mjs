import js from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";
import prettier from "eslint-config-prettier";
import globals from "globals";
import tseslint from "typescript-eslint";

const nextRules = {
  ...(nextPlugin.configs.recommended?.rules ?? {}),
  ...(nextPlugin.configs["core-web-vitals"]?.rules ?? {}),
};

export default tseslint.config(
  {
    ignores: [
      "**/.next/**",
      "**/dist/**",
      "**/coverage/**",
      "**/node_modules/**",
      "**/.turbo/**",
      "packages/supabase/src/types/database.ts",
      "**/next-env.d.ts",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx,js,jsx,mjs,cjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    files: ["**/*.cjs"],
    languageOptions: {
      sourceType: "commonjs",
    },
  },
  {
    files: ["apps/**/*.{ts,tsx,js,jsx}"],
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      ...nextRules,
      "@next/next/no-html-link-for-pages": "off",
    },
    settings: {
      next: {
        rootDir: ["apps/*/"],
      },
    },
  },
  prettier,
);
