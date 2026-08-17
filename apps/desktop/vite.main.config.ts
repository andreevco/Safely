import path from 'node:path';
import { defineConfig } from 'vite';

const STUB_PLUGIN = path.resolve(__dirname, 'src/main/plugins/hardware-key/secure-enclave.stub.ts');

/* electron-forge supplies the CJS lib build, the electron externals and the
   `MAIN_WINDOW_VITE_*` defines. */
export default defineConfig(({ mode }) => ({
    /* Development gets the stub plugin instead of the Secure Enclave one, so the code using it
       never branches and the stub cannot end up in a packaged bundle. The alias matches the
       specifier as written — `./secure-enclave`, re-exported by the `hardware-key` index — and has
       to match all of it, because only the part that matched is replaced. */
    resolve: {
        alias:
            mode === 'production' ? [] : [{ find: /^.*secure-enclave$/, replacement: STUB_PLUGIN }]
    }
}));
