import { IStorage } from '../I-storage';

export class SecureEncryptedKeyRepository {
    constructor(private readonly secureEncryptedStorage: IStorage) {}

    public async getDMKPrv(): Promise<Buffer> {
        const key = await this.secureEncryptedStorage.getItem('dmk_prv');
        if (!key) {
            throw new Error('DMK private key not found');
        }
        return Buffer.from(key, 'hex');
    }

    public async getMasterKey(): Promise<Buffer> {
        const key = await this.secureEncryptedStorage.getItem('master_key');
        if (!key) {
            throw new Error('Master key not found');
        }
        return Buffer.from(key, 'hex');
    }

    public async getVaultKey(): Promise<Buffer> {
        const key = await this.secureEncryptedStorage.getItem('vault_key');
        if (!key) {
            throw new Error('Vault key not found');
        }
        return Buffer.from(key, 'hex');
    }

    public async initialize(opts: {
        masterKey: Buffer;
        vaultKey: Buffer;
        dmkPrv: Buffer;
    }): Promise<void> {
        await this.secureEncryptedStorage.setItem('master_key', opts.masterKey.toString('hex'));
        await this.secureEncryptedStorage.setItem('vault_key', opts.vaultKey.toString('hex'));
        await this.secureEncryptedStorage.setItem('dmk_prv', opts.dmkPrv.toString('hex'));
    }
}
