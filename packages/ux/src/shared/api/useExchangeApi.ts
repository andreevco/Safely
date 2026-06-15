import { useMemo } from 'react';

import { ExchangeApi } from '@safely/core';

import { useBootConfig } from './useBootConfig';

export function useExchangeApi() {
    const { exchange } = useBootConfig();

    return useMemo(() => new ExchangeApi({ baseUrl: exchange.url }), []);
}
