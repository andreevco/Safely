import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

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
