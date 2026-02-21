import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        port: 3001,
        strictPort: true,
        proxy: {
            '/api': {
                target: 'http://20.124.131.193:3000',
                changeOrigin: true,
                secure: false,
            }
        }
    }
})
