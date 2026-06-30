import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  root: path.resolve(__dirname, "src/extension"),
  base: "./",
  build: {
    outDir: path.resolve(__dirname, "dist-extension"),
    emptyOutDir: true, // Clean the output directory before build
    rollupOptions: {
      input: {
        extension: path.resolve(__dirname, "src/extension/index.html")
      }
    }
  },
  resolve: {
    alias: {
      "../api/": path.resolve(__dirname, "src/shared/api/"),
      "../components/": path.resolve(__dirname, "src/shared/components/"),
      "../domain/": path.resolve(__dirname, "src/shared/domain/")
    }
  }
});
