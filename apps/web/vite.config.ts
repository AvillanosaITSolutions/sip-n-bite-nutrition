import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const envDir = process.cwd();
  const loaded = loadEnv(mode, envDir, "VITE_");
  console.log("[vite-config] cwd =", envDir);
  console.log("[vite-config] mode =", mode);
  console.log("[vite-config] loaded VITE_* =", loaded);
  return {
    plugins: [react()],
    server: {
      port: 5173,
      allowedHosts: [".ngrok-free.dev", ".ngrok-free.app", ".ngrok.io"],
    },
  };
});
