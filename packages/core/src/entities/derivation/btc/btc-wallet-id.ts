import { Id } from '../../../utils/id';
import { BLOCKCHAIN_NAME } from '../../blockchain/blockchain-name';

export class BtcWalletId extends Id {
    public readonly blockchain = BLOCKCHAIN_NAME.BTC;

    constructor(
        private readonly ownerId: Id,
        private readonly walletAddress: string
    ) {
        super();
    }

    public toString(): string {
        return this.of(this.ownerId, 'wallet', this.blockchain, this.walletAddress);
    }
}
