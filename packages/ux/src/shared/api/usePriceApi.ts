import { useMemo } from 'react';

import { PriceApi } from '@safely/core';

import { useBootConfig } from './useBootConfig';

export function usePriceApi() {
    const { currencies } = useBootConfig();

    return useMemo(
        () =>
            new PriceApi({
                baseUrl: currencies.prices_api_url
            }),
        [currencies.prices_api_url]
    );
}
