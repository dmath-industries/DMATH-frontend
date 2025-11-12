import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import boundaries from "eslint-plugin-boundaries";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "coverage/**",
      "playwright-report/**",
      "scripts/**",
      "**/__tests__/**",
      "**/*.test.ts",
      "**/*.test.tsx",
    ],
  },
  {
    plugins: {
      boundaries,
    },
    rules: {
      "boundaries/element-types": [
        "warn",
        {
          default: "disallow",
          rules: [
            {
              from: ["app"],
              allow: ["components", "types", "shared", "services", "store", "algorithms"],
            },
            {
              from: ["components"],
              allow: ["types", "shared", "services", "store", "algorithms"],
            },
            {
              from: ["services"],
              allow: ["types", "shared", "algorithms"],
            },
            {
              from: ["store"],
              allow: ["types", "shared"],
            },
            {
              from: ["shared"],
              allow: ["types"],
            },
            {
              from: ["algorithms"],
              allow: ["types", "components"],
            },
          ],
        },
      ],
      "boundaries/no-unknown": "warn",
      "@typescript-eslint/no-explicit-any": ["warn", { ignoreRestArgs: true }],
      "react/no-unescaped-entities": "off",
    },
    settings: {
      "boundaries/elements": [
        { type: "app", pattern: "app/**" },
        { type: "components", pattern: "components/**" },
        { type: "services", pattern: "services/**" },
        { type: "store", pattern: "shared/store/**" },
        { type: "shared", pattern: "shared/**" },
        { type: "types", pattern: "types/**" },
        { type: "algorithms", pattern: "src/algorithms/**" },
      ],
    },
  },
];

export default eslintConfig;
