import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Worker do MapLibre copiado de node_modules (scripts/copy-maplibre-worker.mjs).
    "public/maplibre/**",
    // Tipos gerados pelo Supabase.
    "src/lib/supabase/database.types.ts",
    // Material de divulgação (vídeos com bibliotecas de terceiros) e documentos internos: fora do site.
    "divulgacao/**",
    "interno/**",
  ]),
]);

export default eslintConfig;
