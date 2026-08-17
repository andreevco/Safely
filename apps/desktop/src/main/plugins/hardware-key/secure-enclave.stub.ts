import { createStubHardwareKey } from './stub-key';
import type { HardwareKey } from './types';
import { mainLogger } from '../../logger';

/** Substituted for `secure-enclave.ts` in development builds — see `vite.main.config.ts`. */
export function loadSecureEnclave(): HardwareKey {
    mainLogger.warn('Vault is running on the development stub — stored secrets are not protected');

    return createStubHardwareKey();
}
