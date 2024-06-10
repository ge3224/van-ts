import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "./src/van.ts"),
      name: "VanTS",
      formats: ["es", "cjs", "umd", "iife"]
    },
    minify: "terser",
    terserOptions: {
      compress: {
        ecma: 2015,
        computed_props: false,
        arrows: true,
        conditionals: true,
      },
    }
  }
})
