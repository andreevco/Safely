import { afterEach, describe, expect, it } from 'vitest';

import { loadSecureEnclave } from '../../../../src/main/plugins/hardware-key/secure-enclave';

describe('secure enclave plugin', () => {
    const platform = process.platform;

    const pretendPlatform = (value: string): void => {
        Object.defineProperty(process, 'platform', { value, configurable: true });
    };

    afterEach(() => {
        pretendPlatform(platform);
    });

    /* The addon is macOS-only and the guard has to hold before `require` runs: a throw here would
       stop the app from starting on a platform that simply has no vault. */
    it('is absent off macOS', () => {
        pretendPlatform('win32');

        expect(loadSecureEnclave()).toBeNull();
    });
});
