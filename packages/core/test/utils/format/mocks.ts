import { vi } from 'vitest';

import type { ISecretEncryptor, SSecretDecrypted, SSecretEncrypted } from '../../../src';
import type { IMnemonicAccessor } from '../../../src/entities/mnemonic/mnemonic';

export class MockSecretEncryptor implements ISecretEncryptor {
    decryptSecret = vi.fn().mockImplementation(async (s: SSecretEncrypted): Promise<SSecretDecrypted> => s);
    encryptSecret = vi.fn().mockImplementation(async (s: SSecretDecrypted): Promise<SSecretEncrypted> => s);
}

export class ClosableMnemonicAccessorVault implements IMnemonicAccessor {
    constructor(public readonly value: string[]) {}
}
