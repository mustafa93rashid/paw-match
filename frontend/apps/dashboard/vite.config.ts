import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Backend has no CORS middleware and uses `sameSite: "strict"` cookies, so
// the dev server proxies /api to the backend to keep requests same-origin.
// See frontend integration risks in the project analysis report.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
