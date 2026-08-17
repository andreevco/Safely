import { createRequire } from 'node:module';
import path from 'node:path';

import type { HardwareKey } from './types';

/**
 * The addon exports exactly `HardwareKey`, so the module is the port with nothing in between.
 * `null` where it cannot exist: another platform, or a build without the binary.
 *
 * `node_modules` never reaches the packaged app, so the addon travels as an extra resource and is
 * loaded by path — see `forge.config.ts`.
 */
export function loadSecureEnclave(): HardwareKey | null {
    if (process.platform !== 'darwin') {
        return null;
    }

    try {
        return createRequire(__filename)(
            path.join(process.resourcesPath, 'hardware_key.node')
        ) as HardwareKey;
    } catch {
        return null;
    }
}
