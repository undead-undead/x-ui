import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // 必须为空字符串，这样打包出的资源引用才是相对路径 (src="assets/...")
  // 从而能配合后端注入的 <base href="/xxx/"> 标签正确加载资源
  base: '',
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      }
    }
  }
})