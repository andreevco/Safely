import type { PasscodeStorage } from '@safely/web-ui';

import { createStructuredStorage, secureEncryptedStructure } from './structured';
import type { DesktopBridge } from '../../shared/bridge';

export function createPasscodeStorage(bridge: DesktopBridge): PasscodeStorage {
    const storage = createStructuredStorage(bridge.secureEncryptedStore, secureEncryptedStructure);

    return {
        get: () => storage.get('passcode'),
        set: passcode => storage.set('passcode', passcode)
    };
}
