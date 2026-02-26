import js from "@eslint/js";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import jsxA11yPlugin from "eslint-plugin-jsx-a11y";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import importPlugin from "eslint-plugin-import";
import globals from "globals";

export default [
  {
    ignores: [
      "node_modules/**",
      "build/**",
      "public/build/**",
      ".shopify/**",
      "app/types/**",
      ".react-router/**",
    ],
  },

  {
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.es6,
        process: "readonly",
        shopify: "readonly",
      },
    },
  },

  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      react: reactPlugin,
      "jsx-a11y": jsxA11yPlugin,
      "react-hooks": reactHooksPlugin,
    },
    rules: {
      ...reactPlugin.configs.flat.recommended.rules,
      ...reactPlugin.configs.flat["jsx-runtime"].rules,
      ...reactHooksPlugin.configs.recommended.rules,
      ...jsxA11yPlugin.flatConfigs.recommended.rules,
    },
    settings: {
      react: { version: "detect" },
      formComponents: ["Form"],
      linkComponents: [
        { name: "Link", linkAttribute: "to" },
        { name: "NavLink", linkAttribute: "to" },
      ],
    },
  },

  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "@typescript-eslint": tsPlugin,
      import: importPlugin,
    },
    languageOptions: {
      parser: tsParser,
    },
    settings: {
      "import/internal-regex": "^~/",
      "import/resolver": {
        node: { extensions: [".ts", ".tsx"] },
        typescript: { alwaysTryTypes: true },
      },
    },
    rules: {
      ...tsPlugin.configs["flat/recommended"].rules,
      ...importPlugin.flatConfigs.recommended.rules,
      ...importPlugin.flatConfigs.typescript.rules,
    },
  },

  {
    files: [
      "eslint.config.js",
      "vite.config.{js,ts}",
      "**/*.server.{js,ts}",
    ],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
];
