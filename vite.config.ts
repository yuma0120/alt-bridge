import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";


const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig(({ mode }) => {
  if (mode === "content") {
    return {
      build: {
        outDir: "dist",
        emptyOutDir: false,
        rollupOptions: {
          input: `${root}src/content/index.ts`,
          output: {
            format: "iife",
            name: "AltBridgeContent",
            entryFileNames: "content.js",
            inlineDynamicImports: true,
          },
        },
      },
    };
  }

  return {
    build: {
      outDir: "dist",
      emptyOutDir: true,
      rollupOptions: {
        input: {
          popup: `${root}popup.html`,
          options: `${root}options.html`,
          background: `${root}src/background/index.ts`,
        },
        output: {
          entryFileNames: "[name].js",
          chunkFileNames: "assets/[name]-[hash].js",
          assetFileNames: "assets/[name]-[hash][extname]",
        },
      },
    },
    test: {
      setupFiles: ["src/test/setup.ts"],
    },
  };
});
