import { FlatCompat } from "@eslint/eslintrc";

const eslintConfig = [
  ...new FlatCompat({
    baseDirectory: import.meta.dirname,
  }).extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: ["supabase/functions/**", ".next/**", "node_modules/**", "next-env.d.ts"],
  },
];

export default eslintConfig;
