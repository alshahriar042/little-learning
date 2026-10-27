import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import fs from "node:fs";
import path from "node:path";

/** When assets are served from R2, the bundled dev-assets copy must not ship to Cloudflare Pages. */
function dropDevAssets(assetBase: string): Plugin {
  return {
    name: "drop-dev-assets",
    apply: "build",
    closeBundle() {
      if (assetBase) fs.rmSync(path.resolve("dist/dev-assets"), { recursive: true, force: true });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const assetBase = env.VITE_ASSET_BASE_URL ?? "";
  return {
    resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
    build: { target: "es2022", sourcemap: false },
    plugins: [
      react(),
      tailwindcss(),
      dropDevAssets(assetBase),
      VitePWA({
        strategies: "injectManifest",
        srcDir: "src",
        filename: "sw.ts",
        registerType: "prompt",
        injectRegister: false,
        injectManifest: {
          rollupFormat: "iife",
          globPatterns: ["**/*.{js,css,html,woff2,svg,png,webmanifest,ico}"],
          globIgnores: ["dev-assets/**", "content/**", "icons/splash-*"],
        },
        manifest: {
          id: "/",
          name: "Little Learners BD",
          short_name: "Little Learners",
          description: "Bilingual (Bangla + English) early learning for ages 1-5. No ads, works offline.",
          start_url: "/",
          scope: "/",
          display: "standalone",
          orientation: "portrait",
          theme_color: "#2f9e8f",
          background_color: "#fff8ec",
          lang: "en",
          categories: ["education", "kids"],
          icons: [
            { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
            { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
            { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
            { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          ],
          shortcuts: [
            { name: "Picture Words", short_name: "Words", url: "/m/picture-words", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
            { name: "Games", short_name: "Games", url: "/m/picture-words/games", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
          ],
        },
        devOptions: { enabled: false },
      }),
    ],
    test: { include: ["tests/**/*.test.ts"], environment: "node" },
  };
});
