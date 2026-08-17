import { randomBytes } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { HardwareKey } from '../../../src/main/plugins/hardware-key';
import { createStubHardwareKey } from '../../../src/main/plugins/hardware-key';
import { selfTestVault } from '../../../src/main/vault';

describe('vault self-test', () => {
    let directory: string;
    let filePath: string;

    beforeEach(async () => {
        directory = await fs.mkdtemp(path.join(os.tmpdir(), 'safely-self-test-'));
        filePath = path.join(directory, 'vault-self-test.json');
    });

    afterEach(async () => {
        await fs.rm(directory, { recursive: true, force: true });
    });

    it('times the whole hardware path', async () => {
        const report = await selfTestVault(createStubHardwareKey(), filePath, 'test.self-test');

        expect(report.initMs).toBeGreaterThanOrEqual(0);
        expect(report.openMs).toBeGreaterThanOrEqual(0);
    });

    it('leaves nothing behind', async () => {
        await selfTestVault(createStubHardwareKey(), filePath, 'test.self-test');

        expect(await fs.readdir(directory)).toEqual([]);
    });

    it('fails loudly when what comes back is not what went in', async () => {
        /* A key that differs per unwrap is the shape of a broken hardware path. */
        const inconsistent: HardwareKey = {
            ...createStubHardwareKey(),
            open: () => Promise.resolve(randomBytes(32))
        };

        await expect(selfTestVault(inconsistent, filePath, 'test.self-test')).rejects.toThrow();
    });

    it('cleans up even when it fails', async () => {
        const inconsistent: HardwareKey = {
            ...createStubHardwareKey(),
            open: () => Promise.resolve(randomBytes(32))
        };

        await expect(selfTestVault(inconsistent, filePath, 'test.self-test')).rejects.toThrow();
        expect(await fs.readdir(directory)).toEqual([]);
    });
});
