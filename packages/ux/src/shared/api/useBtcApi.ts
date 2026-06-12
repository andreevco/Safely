import { useCallback } from 'react';

import { BtcApi, BtcNetwork } from '@safely/core';

import { useBootConfig } from './useBootConfig';
import { useAppContext } from '../providers';

export function useGetBtcApi(): (network: BtcNetwork) => BtcApi {
    const { blockchains } = useBootConfig();
    const { logger } = useAppContext();

    return useCallback(
        (network: BtcNetwork) =>
            new BtcApi({
                baseUrl:
                    network === BtcNetwork.MAINNET
                        ? blockchains.bitcoin.mainnet.api_url
                        : blockchains.bitcoin.testnet!.api_url,
                logger
            }),
        [blockchains.bitcoin.mainnet.api_url, blockchains.bitcoin.testnet?.api_url, logger]
    );
}

export function useBtcApi(network: BtcNetwork) {
    const resolve = useGetBtcApi();
    return resolve(network);
}
