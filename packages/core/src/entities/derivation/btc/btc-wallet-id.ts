import { Id } from '../../../utils/id';
import { BLOCKCHAIN_NAME } from '../../blockchain/blockchain-name';
import { IDerivationId } from '../I-derivation';

export class BtcWalletId extends Id {
    public readonly blockchain = BLOCKCHAIN_NAME.BTC;

    constructor(
        public readonly derivationId: IDerivationId,
        private readonly walletAddress: string
    ) {
        super();
    }

    public toString(): string {
        return this.of(this.derivationId, 'wallet', this.blockchain, this.walletAddress);
    }
}
