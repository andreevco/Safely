import { useQuery } from '@tanstack/react-query';

import { useActiveBtcApi } from './api';
import { btcBlockchain } from './keys';

export function useActualBtcBlockNumber() {
    const btcApi = useActiveBtcApi();

    return useQuery<number>({
        queryKey: btcBlockchain.blockNumber(btcApi).toKey(),
        queryFn: () => btcApi.getBlockTipHeight(),
        refetchInterval: 1000 * 30,
        staleTime: 1000 * 30
    });
}
