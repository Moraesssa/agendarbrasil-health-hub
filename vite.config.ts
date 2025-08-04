
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { visualizer } from "rollup-plugin-visualizer";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
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
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Production optimizations
    target: 'es2015',
    minify: mode === 'production' ? 'terser' : false,
    sourcemap: mode === 'development',
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // CRITICAL: Keep React and React-DOM in main chunk to prevent createContext issues
          if (id.includes('node_modules')) {
            // Force React to stay in main chunk - NEVER separate it
            if (id.includes('react') || id.includes('react-dom') || id.includes('react/')) {
              return 'main'; // Explicitly keep in main chunk
            }
            if (id.includes('@supabase/supabase-js')) {
              return 'supabase-vendor';
            }
            if (id.includes('lucide-react') || id.includes('@radix-ui')) {
              return 'ui-vendor';
            }
            return 'vendor';
          }
        },
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
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
