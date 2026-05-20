import type { SBtcAccountChainItem } from '@safely/sync-storage';

import type { SignableBtcWallet } from './I-btc-wallet';
import type { BtcNetwork } from '../../blockchain';

export interface IDerivationChainItemBtc {
    wallets: SignableBtcWallet[];

    xpub: string;

    network: BtcNetwork;

    toJSON(): SBtcAccountChainItem;
}
