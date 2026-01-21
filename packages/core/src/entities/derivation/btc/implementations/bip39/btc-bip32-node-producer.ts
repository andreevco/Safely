import { HDKey } from '@scure/bip32';

import { assertUnreachable } from '../../../../../utils/types';
import { BtcNetwork, BtcWalletType } from '../../../../blockchain';
import { ISeedProducer } from '../../../../seed/I-seed-producer';
import { IBtcNodeProducer } from '../../I-btc-node-producer';

export class BtcBip32NodeProducer implements IBtcNodeProducer {
    constructor(
        protected readonly seedProducer: ISeedProducer,
        private readonly walletType: BtcWalletType,
        private readonly network: BtcNetwork,
        private readonly derivationIndex: number
    ) {}

    private getDerivationPath(): string {
        if (this.walletType === BtcWalletType.NATIVE_SEGWIT) {
            let networkValue;
            if (this.network === BtcNetwork.MAINNET) {
                networkValue = '0';
            } else if (this.network === BtcNetwork.TESTNET) {
                networkValue = '1';
            } else {
                assertUnreachable(this.network);
            }

            return `m/84'/${networkValue}'/${this.derivationIndex}'`;
        } else {
            assertUnreachable(this.walletType);
        }
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
