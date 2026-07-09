import { HDKey } from '@scure/bip32';

import type { BtcNetwork, BtcWalletType } from '../../../../blockchain';
import { BtcDerivationPath } from '../../../../blockchain';
import type { ISeedProducer } from '../../../../seed/I-seed-producer';
import type { IBtcNodeProducer } from '../../I-btc-node-producer';

export class BtcBip32NodeProducer implements IBtcNodeProducer {
    constructor(
        protected readonly seedProducer: ISeedProducer,
        private readonly walletType: BtcWalletType,
        private readonly network: BtcNetwork,
        private readonly derivationIndex: number
    ) {}

    private getDerivationPath(): string {
        return new BtcDerivationPath(this.walletType, this.network, this.derivationIndex).account();
    }

    public async getPortfolioDerivation(): Promise<HDKey> {
        const seed = await this.seedProducer.getSeed();
        const root = HDKey.fromMasterSeed(seed);

        const child = root.derive(this.getDerivationPath());

        if (!child.privateKey || !child.publicKey) {
            throw new Error('Derived node has no private key (invalid derivation or seed).');
        }
        return child;
    }
}
