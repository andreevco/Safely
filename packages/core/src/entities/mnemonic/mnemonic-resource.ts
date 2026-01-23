import { IMnemonic, IMnemonicAccessor } from './mnemonic';
import { IMnemonicVault } from './mnemonic-vault';

export class MnemonicResource implements IMnemonicAccessor, IMnemonicVault {
    #value: IMnemonic | IMnemonicAccessor | undefined;

    public get value(): IMnemonic {
        if (this.#value === undefined) {
            throw new Error('Secret is no more available');
        }

        return Array.isArray(this.#value) ? this.#value : this.#value.value;
    }

    constructor(secret: IMnemonic | IMnemonicAccessor) {
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
