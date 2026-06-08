import { useMemo } from 'react';

import { PriceApi } from '@safely/core';

import { useBootConfig } from './useBootConfig';
import { useAppContext } from '../providers';

export function usePriceApi() {
    const { currencies } = useBootConfig();
    const { logger } = useAppContext();

    return useMemo(
        () =>
            new PriceApi({
                baseUrl: currencies.prices_api_url,
                logger
            }),
        [currencies.prices_api_url, logger]
    );
}
