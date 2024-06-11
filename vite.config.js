import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "./src/van.ts"),
      name: "van_ts",
      formats: ["es", "cjs", "umd", "iife"],
    },
  }
})
