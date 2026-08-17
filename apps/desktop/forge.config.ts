import { MakerZIP } from '@electron-forge/maker-zip';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { VitePlugin } from '@electron-forge/plugin-vite';
import type { ForgeConfig } from '@electron-forge/shared-types';
import { FuseV1Options, FuseVersion } from '@electron/fuses';

/* Opt-in: the profile is per machine and uncommitted, so an unsigned `package` must keep working.
   Signing is what makes the vault's hardware path exist at all — see `signing/README.md`. */
const signing = process.env.SAFELY_SIGN
    ? {
          osxSign: {
              identity: process.env.SAFELY_SIGN_IDENTITY,
              provisioningProfile: 'signing/dev.provisionprofile',
              optionsForFile: (filePath: string) => ({
                  hardenedRuntime: true,
                  /* Only the main binary may reach the keychain group; helpers host the renderer. */
                  entitlements: filePath.includes('Helper')
                      ? 'signing/entitlements.helper.plist'
                      : 'signing/entitlements.plist'
              })
          }
      }
    : {};

const config: ForgeConfig = {
    packagerConfig: {
        asar: true,
        /* `dlopen` needs a real file, and `Contents/Resources` keeps it out of the asar without
           relying on unpack globs, which do not match the dot-directory the bundle lives in. */
        extraResource: ['native/hardware-key/build/Release/hardware_key.node'],
        appBundleId: 'com.safely.wallet-desktop',
        ...signing
    },
    /* Empty on purpose: the addon is N-API, so the binary built against Node loads in Electron
       unchanged — verified, not assumed. */
    rebuildConfig: {},
    /* macOS is the only target for now — the secret vault relies on macOS-only guarantees
       (`doc/vault.md`), so a Windows build would ship a store it cannot protect.
       dmg arrives with the signing and notarisation milestone. */
    makers: [new MakerZIP({}, ['darwin'])],
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
