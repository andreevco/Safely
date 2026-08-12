import { BtcNetwork, BtcWalletType } from './btc-network';
import { assertUnreachable } from '../../../utils/types';

export class BtcDerivationPath {
    constructor(
        private readonly walletType: BtcWalletType,
        private readonly network: BtcNetwork,
        private readonly accountIndex: number
    ) {}

    public account(): string {
        return `m/${this.purpose()}'/${this.coinType()}'/${this.accountIndex}'`;
    }

    public address(change: number, addressIndex: number): string {
        return `${this.account()}/${change}/${addressIndex}`;
    }

    private purpose(): string {
        switch (this.walletType) {
            case BtcWalletType.NATIVE_SEGWIT:
                return '84';
            default:
                assertUnreachable(this.walletType);
        }
    }

    private coinType(): string {
        switch (this.network) {
            case BtcNetwork.MAINNET:
                return '0';
            case BtcNetwork.TESTNET:
                return '1';
            default:
                assertUnreachable(this.network);
        }
    }
}
