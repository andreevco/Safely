import { MakerZIP } from '@electron-forge/maker-zip';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { VitePlugin } from '@electron-forge/plugin-vite';
import type { ForgeConfig } from '@electron-forge/shared-types';
import { FuseV1Options, FuseVersion } from '@electron/fuses';

const config: ForgeConfig = {
    packagerConfig: {
        asar: true,
        appBundleId: 'com.safely.wallet-desktop'
    },
    rebuildConfig: {},
    /* dmg/squirrel arrive with the signing and notarisation milestone */
    makers: [new MakerZIP({}, ['darwin', 'linux', 'win32'])],
    plugins: [
        new VitePlugin({
            /* Object entries: the output file name is the entry key, and main and preload share
               `.vite/build/` — two entries named `index` would overwrite each other. */
            build: [
                {
                    entry: { main: 'src/main/index.ts' },
                    config: 'vite.main.config.ts',
                    target: 'main'
                },
                {
                    entry: { preload: 'src/preload/index.ts' },
                    config: 'vite.preload.config.ts',
                    target: 'preload'
                }
            ],
            renderer: [
                {
                    name: 'main_window',
                    config: 'vite.renderer.config.ts'
                }
            ]
        }),
        /* No node inside the app, no debugging entry points, asar contents integrity-checked. */
        new FusesPlugin({
            version: FuseVersion.V1,
            [FuseV1Options.RunAsNode]: false,
            [FuseV1Options.EnableCookieEncryption]: true,
            [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
            [FuseV1Options.EnableNodeCliInspectArguments]: false,
            [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
            [FuseV1Options.OnlyLoadAppFromAsar]: true
        })
    ]
};

export default config;
