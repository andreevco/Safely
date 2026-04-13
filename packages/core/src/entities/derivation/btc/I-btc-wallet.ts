import { BtcWalletId } from './btc-wallet-id';
import { BtcNetwork, BtcWalletType } from '../../blockchain';
import type { BtcSigningRequest } from '../../signer';
import type { Derivation } from '../derivation';

export interface BtcWalletReadOnly {
    type: BtcWalletType.NATIVE_SEGWIT;
    id: BtcWalletId;
    address: string;
    network: BtcNetwork;
    xpub: string | null;
}

export interface SignableBtcWallet extends BtcWalletReadOnly {
    derivationRef: Derivation;

    xpub: string;

    sign(tx: BtcSigningRequest): Promise<Buffer>;
}
