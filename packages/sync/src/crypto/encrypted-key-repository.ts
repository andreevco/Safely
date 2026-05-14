import type { IStorage } from '../I-storage';

type PublicKeys = {
    dmkPub: Buffer;
    selfIKPub: Buffer;
};

export class EncryptedKeyRepository {
    private dmkPub: Buffer | null = null;
    private selfIKPub: Buffer | null = null;

    constructor(
        private readonly encryptedStorage: IStorage,
        publicKeys?: PublicKeys
    ) {
        if (publicKeys) {
            this.dmkPub = Buffer.from(publicKeys.dmkPub);
            this.selfIKPub = Buffer.from(publicKeys.selfIKPub);
        }
    }

    public static async initialize(encryptedStorage: IStorage): Promise<EncryptedKeyRepository> {
        const repository = new EncryptedKeyRepository(encryptedStorage);
        await repository.loadPublicKeys();
        return repository;
    }

    public async getSyncKey(): Promise<Buffer> {
        const key = await this.encryptedStorage.getItem('sync_key');
        if (!key) {
            throw new Error('Sync key not found');
        }
        return Buffer.from(key, 'hex');
    }

    public getDMKPub(): Buffer {
        if (!this.dmkPub) {
            throw new Error('DMK public key not loaded');
        }
        return Buffer.from(this.dmkPub);
    }

    public getIKPub(): Buffer {
        if (!this.selfIKPub) {
            throw new Error('Identity key public part not loaded');
        }
        return Buffer.from(this.selfIKPub);
    }

    public async getIKPrv(): Promise<Buffer> {
        const key = await this.encryptedStorage.getItem('self_ik_prv');
        if (!key) {
            throw new Error('Identity key private part not found');
        }
        return Buffer.from(key, 'hex');
    }

    public async initialize(opts: {
        syncKey: Buffer;
        dmkPub: Buffer;

        selfIKPub: Buffer;
        selfIKPrv: Buffer;
    }): Promise<void> {
        await this.encryptedStorage.setItem('dmk_pub', opts.dmkPub.toString('hex'));
        await this.encryptedStorage.setItem('sync_key', opts.syncKey.toString('hex'));
        await this.encryptedStorage.setItem('self_ik_pub', opts.selfIKPub.toString('hex'));
        await this.encryptedStorage.setItem('self_ik_prv', opts.selfIKPrv.toString('hex'));
        this.dmkPub = Buffer.from(opts.dmkPub);
        this.selfIKPub = Buffer.from(opts.selfIKPub);
    }

    private async loadPublicKeys(): Promise<void> {
        const dmkPub = await this.encryptedStorage.getItem('dmk_pub');
        if (!dmkPub) {
            throw new Error('DMK public key not found');
        }

        const selfIKPub = await this.encryptedStorage.getItem('self_ik_pub');
        if (!selfIKPub) {
            throw new Error('Identity key public part not found');
        }

        this.dmkPub = Buffer.from(dmkPub, 'hex');
        this.selfIKPub = Buffer.from(selfIKPub, 'hex');
    }
}
