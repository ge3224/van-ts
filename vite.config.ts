import { resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  mode: "production",
  build: {
    lib: {
      entry: resolve(__dirname, "./src/van.ts"),
      name: "VanTS",
      formats: ["es", "cjs", "umd", "iife"],
      fileName: (format) => `van-ts.${format}.js`,
    },
  },
  plugins: [dts({ exclude: ["./src/main.ts"] })],
});
