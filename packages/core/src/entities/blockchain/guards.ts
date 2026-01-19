import { TonContract } from './ton';
import { BtcWallet } from '../portfolio';
import { BLOCKCHAIN } from './blockchain';

export function isTonContract(wallet: TonContract | BtcWallet): wallet is TonContract {
    return wallet.id.blockchain === BLOCKCHAIN.TON;
}

export function isBtcWallet(wallet: TonContract | BtcWallet): wallet is BtcWallet {
    return wallet.id.blockchain === BLOCKCHAIN.BTC;
}
