import { saf751, saf751Async } from '@safely/sync';

import { mnemonicToSeed } from './bip39-seed';
import type { IMnemonicVault } from '../mnemonic';
import type { ISeedProducer } from './I-seed-producer';

export class BtcBip39SeedProducer implements ISeedProducer {
    constructor(private readonly vault: IMnemonicVault) {}

    public async getSeed(): Promise<Buffer> {
        const mnemonic = await saf751Async('core.seedProducer.getMnemonic', () =>
            this.vault.getMnemonic()
        );

        saf751('core.seedProducer.mnemonicReady', { words: mnemonic.length });

        const seed = await mnemonicToSeed(mnemonic.join(' '));

        saf751('core.seedProducer.seedReady', { seedBytes: seed.byteLength });

        return Buffer.from(seed);
    }
}
