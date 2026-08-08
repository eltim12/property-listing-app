import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiOrigin = (env.VITE_API_ORIGIN || "http://localhost:4000").replace(
    /\/$/,
    "",
  );
  // Firebase Hosting serves the backoffice under /admin/
  const base = mode === "production" ? "/admin/" : "/";

  return {
    base,
    plugins: [vue(), tailwindcss()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: apiOrigin,
          changeOrigin: true,
        },
        "/uploads": {
          target: apiOrigin,
          changeOrigin: true,
        },
      },
    },
  };
});
