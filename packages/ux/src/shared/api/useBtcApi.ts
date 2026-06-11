import { useMemo } from 'react';

import { BtcApi, BtcNetwork } from '@safely/core';

import { useBootConfig } from './useBootConfig';
import { useAppContext } from '../providers';

export function useGetBtcApi(): (network: BtcNetwork) => BtcApi {
    const { blockchains } = useBootConfig();
    const { logger } = useAppContext();

    return useMemo(() => {
        const apis = {
            [BtcNetwork.MAINNET]: new BtcApi({
                baseUrl: blockchains.bitcoin.mainnet.api_url,
                logger
            }),
            [BtcNetwork.TESTNET]: new BtcApi({
                baseUrl: blockchains.bitcoin.testnet.api_url,
                logger
            })
        };

        return (network: BtcNetwork) => apis[network];
    }, [blockchains.bitcoin.mainnet.api_url, blockchains.bitcoin.testnet.api_url, logger]);
}

export function useBtcApi(network: BtcNetwork) {
    const resolve = useGetBtcApi();
    return resolve(network);
}
