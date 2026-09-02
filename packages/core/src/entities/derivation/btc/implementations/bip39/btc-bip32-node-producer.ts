import { HDKey } from '@scure/bip32';

import { saf751, saf751Async, saf751Sync } from '@safely/sync';

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
        const seed = await saf751Async('core.bip32.getSeed', () => this.seedProducer.getSeed());

        const root = saf751Sync('core.bip32.fromMasterSeed', () => HDKey.fromMasterSeed(seed), {
            seedBytes: seed.byteLength
        });

        const path = this.getDerivationPath();

        const child = saf751Sync('core.bip32.derive', () => root.derive(path), { path });

        saf751('core.bip32.derived', {
            hasPrivateKey: !!child.privateKey,
            hasPublicKey: !!child.publicKey,
            depth: child.depth,
            index: child.index
        });

        if (!child.privateKey || !child.publicKey) {
            throw new Error('Derived node has no private key (invalid derivation or seed).');
        }
        return child;
    }
}
