import { IMnemonic } from './mnemonic';
import { ISecretEncryptor } from '../../di';
import type { SSecretEncrypted } from '../../di/I-secret-encryptor';

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
            await encryptor.encryptSecret(this.mnemonicToString(mnemonic))
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
        const decrypted = await this.bridge.decryptSecret(this.encryptedSecret);
        return MnemonicVault.mnemonicFromString(decrypted);
    }
}

export interface IMnemonicAccessor {
    value: IMnemonic;
}

export class ClosableMnemonicAccessorVault implements IMnemonicAccessor, IMnemonicVault {
    #value: IMnemonic | undefined;

    public get value(): IMnemonic {
        if (this.#value === undefined) {
            throw new Error('Secret is no more available');
        }

        return this.#value;
    }

    constructor(secret: IMnemonic) {
        this.#value = secret;
    }

    public async getMnemonic(): Promise<IMnemonic> {
        return this.value;
    }

    public close() {
        this.#value = undefined;
    }

    public [Symbol.dispose]() {
        this.close();
    }
}

export class ImmediateAccessMnemonicVault implements IMnemonicVault {
    constructor(private readonly mnemonicAccessor: IMnemonicAccessor) {}

    public async getMnemonic(): Promise<IMnemonic> {
        return this.mnemonicAccessor.value;
    }
}
