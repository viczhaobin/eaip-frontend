import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  // 必须使用绝对路径 `/`：React Router 采用 History 路由，
  // 如果 base 用 `./`，深层路由刷新时浏览器会把 ./assets/... 解析到错误路径，
  // 命中 nginx 的 SPA 回退返回 index.html（text/html），导致 JS/CSS 报 MIME 类型错误、页面空白。
  base: '/',
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
