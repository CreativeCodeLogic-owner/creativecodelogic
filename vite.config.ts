import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

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
