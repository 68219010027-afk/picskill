import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
// หน้าเว็บเรียก /api แล้ว Vite จะส่งต่อไป backend (ชื่อ server ใน docker-compose) 
const target = process.env.API_URL || 'http://localhost:3301';
export default defineConfig({
  plugins: [vue(),vueDevTools()],
  server: {
    host: '0.0.0.0',
    port: 5175,
    strictPort: true,
    proxy: { '/api': target },
    watch: { usePolling: true }, // Windows + Docker ต้องใช้ polling ถึงจะเห็นไฟล์ที่แก้
    
    
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
