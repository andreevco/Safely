import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    resolve: {
        alias: {
            '@safely/slottree': resolve(__dirname, '../slottree/src')
        }
    },
    test: {
        setupFiles: ['./tests/setup.ts']
    }
});
