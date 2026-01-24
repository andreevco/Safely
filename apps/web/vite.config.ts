import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [tailwindcss(), react()],
    resolve: {
        alias: {
            '@safely/ux': path.resolve(__dirname, '../../packages/ux/src'),
            '@safely/core': path.resolve(__dirname, '../../packages/core/src')
        }
    }
});
