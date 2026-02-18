import { vi } from 'vitest';

import type { ISecretEncryptor, SSecretDecrypted, SSecretEncrypted } from '../../src';
import type { IMnemonicAccessor } from '../../src/entities/mnemonic/mnemonic';

export class MockSecretEncryptor implements ISecretEncryptor {
    public decryptSecret = vi
        .fn()
        .mockImplementation(async (s: SSecretEncrypted): Promise<SSecretDecrypted> => s);
    public encryptSecret = vi
        .fn()
        .mockImplementation(async (s: SSecretDecrypted): Promise<SSecretEncrypted> => s);
    public removeSecretCache = vi
        .fn()
        .mockImplementation(async (_: SSecretEncrypted): Promise<void> => {});
}

export class ClosableMnemonicAccessorVault implements IMnemonicAccessor {
    constructor(public readonly value: string[]) {}
}
