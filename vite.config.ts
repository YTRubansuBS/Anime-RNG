import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const fileEnv = loadEnv(mode, ".", "");
  const processEnv = (globalThis as any).process?.env ?? {};
  const url = fileEnv.URL || processEnv.URL || "";
  const key = fileEnv.KEY || processEnv.KEY || "";

  return {
    plugins: [react()],
    server: { port: 5173 },
    define: {
      __SUPABASE_URL__: JSON.stringify(url),
      __SUPABASE_KEY__: JSON.stringify(key),
    },
  };
});
