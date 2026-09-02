import { saf751, saf751Async } from '@safely/sync';

import type { IMnemonic, IMnemonicAccessor } from './mnemonic';
import type { ISecretEncryptor, SSecretEncrypted } from '../../di';

export interface IMnemonicVault {
    getMnemonic(): Promise<IMnemonic>;
}

export interface IMnemonicVaultEncryptedSecretStored extends IMnemonicVault {
    encryptedSecret: SSecretEncrypted;
}

export class MnemonicVault implements IMnemonicVaultEncryptedSecretStored {
    private static mnemonicToString(mnemonic: IMnemonic): string {
        return mnemonic.join(' ').toLowerCase();
    }

    private static mnemonicFromString(str: string): IMnemonic {
        return str.toLowerCase().split(' ');
    }

    public static async fromMnemonic(encryptor: ISecretEncryptor, mnemonic: IMnemonic) {
        const plaintext = this.mnemonicToString(mnemonic);

        return new MnemonicVault(
            encryptor,
            await saf751Async('core.vault.encrypt', () => encryptor.encrypt(plaintext), {
                chars: plaintext.length
            })
        );
    }

    public static async fromMnemonicAccessor(
        encryptor: ISecretEncryptor,
        mnemonicAccessor: IMnemonicAccessor
    ) {
        return this.fromMnemonic(encryptor, mnemonicAccessor.value);
    }

    constructor(
        private readonly bridge: ISecretEncryptor,
        public readonly encryptedSecret: SSecretEncrypted
    ) {}

    public async getMnemonic(): Promise<IMnemonic> {
        const decrypted = await saf751Async('core.vault.decrypt', () =>
            this.bridge.decrypt(this.encryptedSecret)
        );

        saf751('core.vault.decrypted', { chars: decrypted.length });

        return MnemonicVault.mnemonicFromString(decrypted);
    }
}
