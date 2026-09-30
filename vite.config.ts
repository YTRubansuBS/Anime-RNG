import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    plugins: [react()],
    server: { port: 5173 },
    define: {
      __SUPABASE_URL__: JSON.stringify(env.URL || ""),
      __SUPABASE_KEY__: JSON.stringify(env.KEY || ""),
    },
  };
});
