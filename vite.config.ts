import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  if (command === "build" && !env.VITE_SUPABASE_ANON_KEY) {
    throw new Error("VITE_SUPABASE_ANON_KEY must be configured for the new Supabase project before building Roomscape.");
  }
  return ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  });
});
