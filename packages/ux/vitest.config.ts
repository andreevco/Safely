import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    resolve: {
        alias: {
            '@safely/core': path.resolve(__dirname, '../core/src')
        }
    },
    test: {
        globals: true,
        environment: 'happy-dom',
        setupFiles: [path.resolve(__dirname, '../core/test/setup-crypto.ts')]
    }
});
