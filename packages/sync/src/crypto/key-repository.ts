import { IStorage } from '../I-storage';

export class KeyRepository {
    constructor(
        private readonly encryptedStorage: IStorage,
        private readonly secureEncryptedStorage: IStorage
    ) {}

    public async getSyncKey(): Promise<Buffer> {
        const key = await this.encryptedStorage.getItem('sync_key');
        if (!key) {
            throw new Error('Sync key not found');
        }
        return Buffer.from(key, 'hex');
    }

    public async getDMKPub(): Promise<Buffer> {
        const key = await this.encryptedStorage.getItem('dmk_pub');
        if (!key) {
            throw new Error('DMK public key not found');
        }
        return Buffer.from(key, 'hex');
    }

    public async getDMKPrv(): Promise<Buffer> {
        const key = await this.secureEncryptedStorage.getItem('dmk_prv');
        if (!key) {
            throw new Error('DMK private key not found');
        }
        return Buffer.from(key, 'hex');
    }

    public async getIKPub(): Promise<Buffer> {
        const key = await this.encryptedStorage.getItem('self_ik_pub');
        if (!key) {
            throw new Error('Identity key public part not found');
        }
        return Buffer.from(key, 'hex');
    }

    public async getIKPrv(): Promise<Buffer> {
        const key = await this.encryptedStorage.getItem('self_ik_prv');
        if (!key) {
            throw new Error('Identity key private part not found');
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
        syncKey: Buffer;
        vaultKey: Buffer;
        dmkPub: Buffer;
        dmkPrv: Buffer;

        selfIKPub: Buffer;
        selfIKPrv: Buffer;
    }): Promise<void> {
        await this.secureEncryptedStorage.setItem('master_key', opts.masterKey.toString('hex'));
        await this.secureEncryptedStorage.setItem('vault_key', opts.vaultKey.toString('hex'));
        await this.secureEncryptedStorage.setItem('dmk_prv', opts.dmkPrv.toString('hex'));

        await this.encryptedStorage.setItem('dmk_pub', opts.dmkPub.toString('hex'));
        await this.encryptedStorage.setItem('sync_key', opts.syncKey.toString('hex'));
        await this.encryptedStorage.setItem('self_ik_pub', opts.selfIKPub.toString('hex'));
        await this.encryptedStorage.setItem('self_ik_prv', opts.selfIKPrv.toString('hex'));
    }
}
