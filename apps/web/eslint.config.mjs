import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import noCrossLayerImport from "./eslint-rules/no-cross-layer-import.mjs";
import noUnstructuredLog from "./eslint-rules/no-unstructured-log.mjs";

const motivePlugin = {
  rules: {
    "no-cross-layer-import": noCrossLayerImport,
    "no-unstructured-log": noUnstructuredLog,
  },
};

const eslintConfig = [
  ...nextVitals,
  ...nextTypescript,
  {
    ignores: [".next/**", "next-env.d.ts", "node_modules/**"],
  },
  {
    files: ["src/**/*.{ts,tsx,js,jsx,mjs}"],
    plugins: { motive: motivePlugin },
    rules: {
      "motive/no-cross-layer-import": "error",
    },
  },
  {
    // Ban console.* in app code. The logger itself and test files are
    // exempted via `ignores` below.
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/lib/motive/log.ts", "src/**/*.test.{ts,tsx}"],
    plugins: { motive: motivePlugin },
    rules: {
      "motive/no-unstructured-log": "warn",
    },
  },
];

export default eslintConfig;
