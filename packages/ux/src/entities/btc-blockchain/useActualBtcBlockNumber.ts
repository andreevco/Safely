import { useQuery } from '@tanstack/react-query';

import { btcBlockchain } from './keys';
import { useBtcApi } from '../../shared';

export function useActualBtcBlockNumber() {
    const btcApi = useBtcApi();

    return useQuery<number>({
        queryKey: btcBlockchain.blockNumber(btcApi).toKey(),
        queryFn: () => btcApi.getBlockBestHeight(),
        refetchInterval: 1000 * 30,
        staleTime: 1000 * 30
    });
}
