import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  root: path.resolve(__dirname, "src/desktop"),
  base: "./",
  build: {
    outDir: path.resolve(__dirname, "dist-desktop"),
    emptyOutDir: true, // Clean the output directory before build
    rollupOptions: {
      input: {
        desktop: path.resolve(__dirname, "src/desktop/desktop.html")
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
