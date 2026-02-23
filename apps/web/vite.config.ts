import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
    plugins: [
        tailwindcss(),
        react(),
        nodePolyfills({
            globals: { Buffer: false, global: true, process: true },
            include: ['stream', 'buffer', 'crypto']
        })
    ],
    resolve: {
        alias: {
            '@safely/ux': path.resolve(__dirname, '../../packages/ux/src'),
            '@safely/core': path.resolve(__dirname, '../../packages/core/src'),
            buffer: 'buffer',
            process: 'process/browser'
        }
    },
    define: {
        'process.env': {}
    },
    optimizeDeps: {
        include: ['buffer', 'process']
    }
});
