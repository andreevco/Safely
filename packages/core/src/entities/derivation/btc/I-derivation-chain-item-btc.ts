import { BtcNetwork } from '../../blockchain';
import type { SBtcAccountChainItem } from '../derivation.stored';
import { SignableBtcWallet } from './I-btc-wallet';

export interface IDerivationChainItemBtc {
    wallets: SignableBtcWallet[];

    xpub: string;

    network: BtcNetwork;

    toJSON(): SBtcAccountChainItem;
}
