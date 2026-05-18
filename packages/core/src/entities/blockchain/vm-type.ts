import { BLOCKCHAIN_NAME } from './blockchain-name';
import { assertUnreachable } from '../../utils';

export enum VM_TYPE {
    BTC = 'BTC'
}

export function vmTypeByBlockchainName(blockchainName: BLOCKCHAIN_NAME): VM_TYPE {
    switch (blockchainName) {
        case BLOCKCHAIN_NAME.BTC:
            return VM_TYPE.BTC;
        default:
            assertUnreachable(blockchainName);
    }
}
