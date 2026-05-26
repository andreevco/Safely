import { vi } from 'vitest';

import type {
    IMnemonic,
    IMnemonicAccessor,
    IMnemonicVault,
    ISecretEncryptor,
    SSecretDecrypted,
    SSecretEncrypted
} from '@safely/core';

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
