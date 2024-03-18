import { defineConfig } from "vite";
import bannerPlugin from "vite-plugin-banner";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
import pkg from "./package.json";

const banner = `
// ==UserScript==
// @name         ADOS Helper (Dev)
// @namespace    https://ados/
// @version      ${pkg.version}
// @description  ADOS Helper
// @author       archerax
// @match        https://ados/WirelineRnD_Collection/WirelineRnD*
// @match        https://dev.azure.com/Weatherford-ADOS-WirelineRnD/WirelineRnD*
// @icon         https://cdn.vsassets.io/content/icons/favicon.ico
// @grant        none
// ==/UserScript==
`.trim();

export default defineConfig({
    plugins: [
        bannerPlugin({ content: banner, verify: false }),
        cssInjectedByJsPlugin()
    ],
    build: {
        manifest: true,
        target: "chrome118",
        chunkSizeWarningLimit: 1024,
        rollupOptions: {
            input: "src/index.tsx",
            output: {
                entryFileNames: "index.user.js",
                manualChunks: undefined
            }
        }
    },
    test: {
        setupFiles: "tests/setup.ts"
    },
});
