import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";
import { createHash } from "node:crypto";
import { TRIQUETRA_LOOPS, TRIQUETRA_VIEWBOX } from "./src/data/triquetra";
import { SOURCE_HASH } from "./src/data/triquetraSamples";

// A production build without these ships a site whose forms, captcha or
// analytics silently switch off — fail fast instead. Names only, never values.
const REQUIRED_PROD_ENV = [
  "VITE_FORMSPARK_FORM_ID_BRIEF",
  "VITE_FORMSPARK_FORM_ID_CONTACT",
  "VITE_CAPTCHA_SITEKEY",
  "VITE_GA_MEASUREMENT_ID",
];

export default defineConfig(({ command, mode }) => {
  if (command === "build" && mode === "production") {
    // loadEnv merges .env files with process.env (process.env wins)
    const env = loadEnv(mode, process.cwd(), "VITE_");
    const missing = REQUIRED_PROD_ENV.filter((name) => !env[name]?.trim());
    if (missing.length) {
      throw new Error(
        `Production build blocked: missing required env var(s): ${missing.join(", ")}. ` +
          "Set them in .env (see .env.example) or the build environment.",
      );
    }
    // The worlds read precomputed path samples; they must match the paths.
    // Same hash as scripts/gen-triquetra-samples.mjs.
    const hash = createHash("sha256")
      .update(JSON.stringify({ viewBox: TRIQUETRA_VIEWBOX, loops: TRIQUETRA_LOOPS }))
      .digest("hex")
      .slice(0, 16);
    if (hash !== SOURCE_HASH) {
      throw new Error("triquetraSamples.ts is stale; run bun run gen:triquetra");
    }
  }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
  };
});
