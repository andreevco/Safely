import { webUiVitePreset } from '@safely/web-ui/vite-preset';
import { defineConfig, mergeConfig } from 'vite';

export default defineConfig(
    mergeConfig(webUiVitePreset(), {
        resolve: {
            /* Overrides electron-forge's default `true`, which does not survive pnpm: every
               workspace package would resolve inside its own `node_modules`, instantiating react
               twice, and the shared stylesheet would look like a node_modules file to Panda's
               PostCSS plugin, which skips those. */
            preserveSymlinks: false
        }
    })
);
