import { BtcDerivationPath, BtcWalletType } from '../entities/blockchain';
import type { BtcNetwork } from '../entities/blockchain';

export const buildLedgerAccountPath = (network: BtcNetwork, accountIndex: number): string =>
    new BtcDerivationPath(BtcWalletType.NATIVE_SEGWIT, network, accountIndex)
        .account()
        .replace(/^m\//, '');
