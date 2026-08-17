import fs from 'node:fs/promises';
import { z } from 'zod';

import { DEK } from './dek';
import { VaultError } from './vault-error';
import type { HardwareKey } from '../plugins/hardware-key';
import { writeFileAtomic } from '../utils/atomic-file';

/** Metadata, not a secret: the DEK in it is sealed to the hardware key. */
const sVaultFile = z.object({
    v: z.literal(1),
    dek: z.string().min(1)
});

type VaultFileContents = z.infer<typeof sVaultFile>;

/**
 * Owns the data key and never hands it out. It is unwrapped per operation and zeroed straight
 * after, so there is no unlocked state and nothing to lock.
 */
export class Vault {
    constructor(
        private readonly hardwareKey: HardwareKey,
        private readonly filePath: string,
        private readonly keyTag: string
    ) {}

    /** An existing vault is left alone even when it cannot be opened: re-creating it would
     *  silently discard the wallet. */
    public async init(): Promise<void> {
        if (await this.read()) {
            return;
        }

        if (!this.hardwareKey.isAvailable()) {
            throw new VaultError('VAULT_UNAVAILABLE');
        }

        await this.hardware(() => this.hardwareKey.ensureKey(this.keyTag));

        using dek = DEK.generate();

        const sealed = await this.hardware(() =>
            this.hardwareKey.seal(this.keyTag, dek.material())
        );

        await this.write({ v: 1, dek: sealed.toString('base64') });
    }

    public async encode(scope: string, key: string, value: string): Promise<string> {
        using dek = await this.openDek();

        return dek.seal(scope, key, value);
    }

    public async decode(scope: string, key: string, stored: string): Promise<string> {
        using dek = await this.openDek();

        return dek.unseal(scope, key, stored);
    }

    /** Crypto-erase: without the hardware key and the sealed DEK every other byte is unopenable. */
    public async erase(): Promise<void> {
        await fs.rm(this.filePath, { force: true });
        await this.hardware(() => this.hardwareKey.destroy(this.keyTag));
    }

    /** A resource: the caller declares it with `using`, so the key is zeroed on the way out. */
    private async openDek(): Promise<DEK> {
        const contents = await this.read();

        if (!contents) {
            throw new VaultError('VAULT_UNAVAILABLE');
        }

        const bytes = await this.hardware(() =>
            this.hardwareKey.open(this.keyTag, Buffer.from(contents.dek, 'base64'))
        );

        return new DEK(bytes);
    }

    /** `null` means "no vault yet"; a file that exists but does not parse is an error, never
     *  absence. */
    private async read(): Promise<VaultFileContents | null> {
        let raw: string;

        try {
            raw = await fs.readFile(this.filePath, 'utf8');
        } catch {
            return null;
        }

        try {
            return sVaultFile.parse(JSON.parse(raw));
        } catch {
            throw new VaultError('VAULT_CORRUPT');
        }
    }

    private async write(contents: VaultFileContents): Promise<void> {
        await writeFileAtomic(this.filePath, JSON.stringify(contents));
    }

    /** Every hardware failure is one fact — the vault cannot be opened. Detail stays on `cause`. */
    private async hardware<T>(operation: () => T | Promise<T>): Promise<T> {
        try {
            return await operation();
        } catch (cause) {
            throw new VaultError('VAULT_UNAVAILABLE', { cause });
        }
    }
}
