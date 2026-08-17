import { Vault } from './vault';
import type { HardwareKey } from '../plugins/hardware-key';

const SAMPLE = 'vault-self-test';
const OPEN_SAMPLES = 20;

export interface VaultSelfTestReport {
    initMs: number;
    /** One unwrap — the vault does one per store operation, so this is what a cache would save. */
    openMs: number;
}

/** Runs the whole hardware path against its own key tag and file, never a real vault. */
export async function selfTestVault(
    hardwareKey: HardwareKey,
    filePath: string,
    keyTag: string
): Promise<VaultSelfTestReport> {
    const vault = new Vault(hardwareKey, filePath, keyTag);

    const initStarted = performance.now();

    await vault.init();

    const initMs = performance.now() - initStarted;

    try {
        const stored = await vault.encode('self-test', 'probe', SAMPLE);
        const openStarted = performance.now();

        for (let sample = 0; sample < OPEN_SAMPLES; sample++) {
            if ((await vault.decode('self-test', 'probe', stored)) !== SAMPLE) {
                throw new Error('Vault self-test read back a different value than it wrote');
            }
        }

        return {
            initMs,
            openMs: (performance.now() - openStarted) / OPEN_SAMPLES
        };
    } finally {
        await vault.erase();
    }
}
