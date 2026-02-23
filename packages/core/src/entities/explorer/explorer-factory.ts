import { BtcExplorer, Explorer } from './index';
import { BootConfig } from '../../api/boot/models';
import { assertUnreachable } from '../../utils';
import { BLOCKCHAIN_NAME } from '../blockchain';

export class ExplorerFactory {
    constructor(private readonly config: BootConfig['blockchains']) {}

    public createExplorer(blockchain: BLOCKCHAIN_NAME.BTC): BtcExplorer;
    public createExplorer(blockchain: BLOCKCHAIN_NAME): Explorer {
        switch (blockchain) {
            case BLOCKCHAIN_NAME.BTC:
                return new BtcExplorer(this.config.bitcoin.mainnet);
            default:
                assertUnreachable(blockchain);
        }
    }
}
