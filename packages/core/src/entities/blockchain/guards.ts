import { BtcWallet } from '../derivation';
import { BLOCKCHAIN_NAME } from './blockchain-name';

export function isBtcWallet(wallet: BtcWallet): wallet is BtcWallet {
    return wallet.id.blockchain === BLOCKCHAIN_NAME.BTC;
}
