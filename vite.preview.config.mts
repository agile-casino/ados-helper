import { defineConfig, type Plugin } from "vite";

// Strips the Eruda mobile devtools from index.html. They are dev-only and must
// not ship to reviewers in the static preview.
const stripDevTools = (): Plugin => ({
  name: "strip-dev-tools",
  transformIndexHtml(html) {
    return html
      .replace(/<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/eruda"><\/script>\s*/, "")
      .replace(/<script>eruda\.init\(\);<\/script>\s*/, "");
  }
});

// Static build of the local dev harness (index.html + src/dev/sandbox.ts) for PR previews.
// Uses relative asset paths so it can be served from any folder (e.g. a per-PR blob prefix).
export default defineConfig({
  base: "./",
  define: {
    __SANDBOX_PREVIEW__: "true"
  },
  plugins: [stripDevTools()],
  build: {
    outDir: "dist-preview",
    emptyOutDir: true,
    target: "chrome118"
  }
});
