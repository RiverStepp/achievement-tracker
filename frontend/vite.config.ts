import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': '/src'
        }
    },
    server: {
        https: true, // Enable HTTPS for frontend dev server
        proxy: {
            '/api': {
                target: 'https://localhost:7111',
                changeOrigin: true,
                secure: false, // Set to false for self-signed certificates in development
            },
        },
    },
});
