import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    resolve: {
        alias: {
            /* Panda's generated helpers are imported through this package's own name
               (`importMap` in panda.config.ts). Self-referencing exports are resolved
               by the apps but not when vitest runs inside this package. */
            '@safely/web-ui/styled-system': path.resolve(__dirname, 'styled-system')
        }
    },
    test: {
        globals: true,
        environment: 'happy-dom'
    }
});
