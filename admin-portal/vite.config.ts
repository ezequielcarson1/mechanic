import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '')
    const apiTarget = env.ADMIN_API_TARGET || 'http://192.168.1.229:3000'

    return {
        plugins: [react()],
        server: {
            port: 3001,
            strictPort: true,
            proxy: {
                '/api': {
                    target: apiTarget,
                    changeOrigin: true,
                    secure: false,
                }
            }
        }
    }
})
