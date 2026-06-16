import { useBtcApi } from '../../shared';
import { useActiveBtcWallet } from '../portfolio';

export function useActiveBtcApi() {
    const wallet = useActiveBtcWallet();
    return useBtcApi(wallet.network);
}
