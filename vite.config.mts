import { defineConfig } from "vite";
import bannerPlugin from "vite-plugin-banner";
import checkerPlugin from 'vite-plugin-checker';
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
import pkg from "./package.json" with { type: "json" };

const banner = `
// ==UserScript==
// @name         ADOS Helper
// @namespace    https://ados/
// @version      ${pkg.version}
// @description  ADOS Helper
// @author       archerax
// @match        https://ados/WirelineRnD_Collection/WirelineRnD*
// @match        https://dev.azure.com/Weatherford-ADOS-WirelineRnD/WirelineRnD*
// @match        https://dev.azure.com/WFRD-RDE-DWC-Software/ProdEng/*
// @icon         https://cdn.vsassets.io/content/icons/favicon.ico
// @grant        none
// ==/UserScript==
`.trim();

export default defineConfig(({ mode }) => ({
    plugins: [
        checkerPlugin({
            biome: { command: "check", flags: "src" },
            typescript: false
        }),
        bannerPlugin({ content: banner, verify: false }),
        cssInjectedByJsPlugin()
    ],
    build: {
        manifest: true,
        target: "chrome118",
        chunkSizeWarningLimit: 1024,
        rolldownOptions: {
            input: "src/index.tsx",
            output: {
                entryFileNames: "index.user.js",
            },
            onwarn(warning, warn) {
                if (warning.code === 'MODULE_LEVEL_DIRECTIVE' && warning.message.includes('use client')) {
                    return;
                }
                warn(warning);
            }
        },
        minify: mode === "production",
        sourcemap: mode === "production" ? true : "inline"
    },
    test: {
        setupFiles: "tests/setup.ts"
    },
}));
