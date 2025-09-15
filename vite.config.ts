
import fs from "fs/promises";
import path from "path";

import react from "@vitejs/plugin-react-swc";
import { componentTagger } from "lovable-tagger";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig } from "vite";

const copyAccessibilityStyles = () => {
  let outDir = "dist";

  return {
    name: "copy-accessibility-styles",
    apply: "build",
    configResolved(config) {
      if (config.build?.outDir) {
        outDir = config.build.outDir;
      }
    },
    async closeBundle() {
      const source = path.resolve(
        __dirname,
        "src/styles/accessibility.css",
      );
      const destination = path.resolve(
        __dirname,
        outDir,
        "assets/styles/accessibility.css",
      );

      await fs.mkdir(path.dirname(destination), { recursive: true });
      await fs.copyFile(source, destination);
    },
  } satisfies import("vite").Plugin;
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "127.0.0.1",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    // Bundle analyzer - generates stats.html in dist folder
    mode === 'production' && visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
    copyAccessibilityStyles(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: 'es2015',
    minify: mode === 'production' ? 'terser' : false,
    sourcemap: mode === 'development',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-popover', 'lucide-react'],
        },
      },
    },
  },
  // Enable dependency pre-bundling for faster dev server
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      '@supabase/supabase-js',
      'lucide-react',
    ],
    // Force React to be pre-bundled to prevent context issues
    force: true,
  },
}));
