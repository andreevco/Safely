import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { HardwareKey } from '../../../src/main/plugins/hardware-key';
import { createStubHardwareKey } from '../../../src/main/plugins/hardware-key';
import { Vault } from '../../../src/main/vault';

describe('Vault', () => {
    let directory: string;
    let filePath: string;

    const createVault = (hardwareKey: HardwareKey = createStubHardwareKey()): Vault =>
        new Vault(hardwareKey, filePath, 'test.vault');

    beforeEach(async () => {
        directory = await fs.mkdtemp(path.join(os.tmpdir(), 'safely-vault-'));
        filePath = path.join(directory, 'vault.json');
    });

    afterEach(async () => {
        await fs.rm(directory, { recursive: true, force: true });
    });

    it('creates the vault file on first init', async () => {
        await createVault().init();

        expect(JSON.parse(await fs.readFile(filePath, 'utf8'))).toMatchObject({ v: 1 });
    });

    it('keeps the existing data key when init runs again', async () => {
        await createVault().init();

        const created = await fs.readFile(filePath, 'utf8');

        await createVault().init();

        expect(await fs.readFile(filePath, 'utf8')).toBe(created);
    });

    it('returns what it encoded, across instances', async () => {
        await createVault().init();

        const stored = await createVault().encode('encrypted', 'master_key', 'deadbeef');

        expect(await createVault().decode('encrypted', 'master_key', stored)).toBe('deadbeef');
    });

    it('refuses to operate before init', async () => {
        await expect(createVault().encode('encrypted', 'master_key', 'x')).rejects.toThrow(
            'VAULT_UNAVAILABLE'
        );
    });

    it('refuses to create a vault the hardware cannot back', async () => {
        const unavailable: HardwareKey = {
            ...createStubHardwareKey(),
            isAvailable: () => false
        };

        await expect(createVault(unavailable).init()).rejects.toThrow('VAULT_UNAVAILABLE');
        await expect(fs.readFile(filePath, 'utf8')).rejects.toThrow();
    });

    it('reports a corrupt vault file rather than treating it as absent', async () => {
        await fs.writeFile(filePath, '{"v":9}', 'utf8');

        await expect(createVault().init()).rejects.toThrow('VAULT_CORRUPT');
    });

    /* Re-creating a vault whose key cannot be unwrapped would silently discard the wallet, so a
       failing hardware key must leave the file exactly as it is. */
    it('does not re-create a vault it failed to open', async () => {
        await createVault().init();

        const created = await fs.readFile(filePath, 'utf8');
        const failing: HardwareKey = {
            ...createStubHardwareKey(),
            open: () => Promise.reject(new Error('hardware refused'))
        };
        const vault = createVault(failing);

        await expect(vault.decode('encrypted', 'master_key', 'v1:AAAA')).rejects.toThrow(
            'VAULT_UNAVAILABLE'
        );
        await vault.init();

        expect(await fs.readFile(filePath, 'utf8')).toBe(created);
    });

    /* The renderer is told a code; what the platform actually said stays in main, on the cause. */
    it('keeps the platform message out of the error and on its cause', async () => {
        await createVault().init();

        const failing: HardwareKey = {
            ...createStubHardwareKey(),
            open: () => Promise.reject(new Error('SecKeyCreateDecryptedData failed: -34018'))
        };

        await expect(
            createVault(failing).decode('encrypted', 'master_key', 'v1:AAAA')
        ).rejects.toMatchObject({
            message: 'VAULT_UNAVAILABLE',
            cause: { message: 'SecKeyCreateDecryptedData failed: -34018' }
        });
    });

    it('leaves earlier values unopenable after erase', async () => {
        await createVault().init();

        const stored = await createVault().encode('encrypted', 'master_key', 'deadbeef');

        await createVault().erase();
        await createVault().init();

        await expect(createVault().decode('encrypted', 'master_key', stored)).rejects.toThrow(
            'DECRYPT_FAILED'
        );
    });

    it('destroys the hardware key on erase', async () => {
        const destroyed: string[] = [];
        const hardwareKey: HardwareKey = {
            ...createStubHardwareKey(),
            destroy: tag => {
                destroyed.push(tag);
            }
        };

        await createVault(hardwareKey).init();
        await createVault(hardwareKey).erase();

        expect(destroyed).toEqual(['test.vault']);
        await expect(fs.readFile(filePath, 'utf8')).rejects.toThrow();
    });
});
