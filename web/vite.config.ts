import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read SSL certificate files for HTTP/2 support in local development
let httpsConfig: any = false;
try {
  const keyPath = path.resolve(__dirname, "ssl/nginx.key");
  const certPath = path.resolve(__dirname, "ssl/nginx.crt");
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    httpsConfig = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };
  }
} catch (e) {
  console.warn("SSL certificates not found, falling back to HTTP.", e);
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    https: httpsConfig,
    proxy: {
      "/api": {
        target: process.env.VITE_BACKEND_URL || "http://localhost:8080",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});

