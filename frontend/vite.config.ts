import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite 配置文件，开启 React 插件，并通过环境变量传递后端地址
export default defineConfig(() => {
  return {
    plugins: [react()],
    server: {
      // 本地开发时可通过环境变量 VITE_DEV_PROXY 代理到后端服务
      proxy: process.env.VITE_DEV_PROXY
        ? {
            "/api": {
              target: process.env.VITE_DEV_PROXY,
              changeOrigin: true
            }
          }
        : undefined
    }
  };
});
