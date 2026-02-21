import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // 1. Tell Vite to look for files in the same folder (fixes blank page)
  base: "./",

  server: {
    host: "::",
    port: 8080,
  },

  // 2. Tell Vite to actually use the React plugin
  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
