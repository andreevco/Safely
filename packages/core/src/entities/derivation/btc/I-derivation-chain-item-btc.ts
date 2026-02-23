import { BtcNetwork, BtcWalletType } from '../../blockchain';
import type { BtcSigningRequest } from '../../signer';
import type { Derivation } from '../derivation';
import type { SBtcAccountChainItem } from '../derivation.stored';
import { BtcWalletId } from './btc-wallet-id';

export interface IDerivationChainItemBtc {
    wallets: BtcWallet[];

    xpub: string;

    network: BtcNetwork;

    toJSON(): SBtcAccountChainItem;
}

export interface BtcWallet {
    type: BtcWalletType.NATIVE_SEGWIT;
    id: BtcWalletId;
    address: string;
    network: BtcNetwork;
    xpub: string;
    derivationRef: Derivation;

    sign(tx: BtcSigningRequest): Promise<Buffer>;
}
