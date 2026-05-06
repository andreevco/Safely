import { mnemonicToSeed } from '@scure/bip39';

import type { IMnemonicVault } from '../mnemonic';
import type { ISeedProducer } from './I-seed-producer';

export class BtcBip39SeedProducer implements ISeedProducer {
    constructor(private readonly vault: IMnemonicVault) {}

    public async getSeed(): Promise<Buffer> {
        const mnemonic = await this.vault.getMnemonic();

        return Buffer.from(await mnemonicToSeed(mnemonic.join(' ')));
    }
}
