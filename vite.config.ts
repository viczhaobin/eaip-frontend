import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  // 必须使用绝对路径 base：React Router 采用 History 路由，base 用 `./` 会导致深层路由刷新 MIME 错误。
  // 本地开发用 `/`；GitHub Pages 项目页挂在 /eaip-frontend/ 子路径，用 GH_PAGES=1 构建时切换。
  base: process.env.GH_PAGES ? '/eaip-frontend/' : '/',
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        // 本地后端服务
        target: 'http://localhost:9096',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
