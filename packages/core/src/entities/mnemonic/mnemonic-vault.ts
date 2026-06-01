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
        return new MnemonicVault(
            encryptor,
            await encryptor.encrypt(this.mnemonicToString(mnemonic))
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
        const decrypted = await this.bridge.decrypt(this.encryptedSecret);
        return MnemonicVault.mnemonicFromString(decrypted);
    }
}
