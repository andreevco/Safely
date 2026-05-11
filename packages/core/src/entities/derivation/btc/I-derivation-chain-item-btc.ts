import type { BtcNetwork } from '../../blockchain';
import type { SBtcAccountChainItem } from '../derivation.stored';
import type { SignableBtcWallet } from './I-btc-wallet';

export interface IDerivationChainItemBtc {
    wallets: SignableBtcWallet[];

    xpub: string;

    network: BtcNetwork;

    toJSON(): SBtcAccountChainItem;
}
