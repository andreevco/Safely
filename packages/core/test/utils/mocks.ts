import { vi } from 'vitest';

import type { ISecretEncryptor, SSecretDecrypted, SSecretEncrypted } from '../../src';
import type { IMnemonic, IMnemonicAccessor } from '../../src/entities/mnemonic/mnemonic';
import type { IMnemonicVault } from '../../src/entities/mnemonic/mnemonic-vault';

export class MockSecretEncryptor implements ISecretEncryptor {
    public decrypt = vi
        .fn()
        .mockImplementation(async (s: SSecretEncrypted): Promise<SSecretDecrypted> => s);
    public encrypt = vi
        .fn()
        .mockImplementation(async (s: SSecretDecrypted): Promise<SSecretEncrypted> => s);
}

export class ClosableMnemonicAccessorVault implements IMnemonicAccessor, IMnemonicVault {
    constructor(public readonly value: string[]) {}

    public async getMnemonic(): Promise<IMnemonic> {
        return this.value;
    }
}
