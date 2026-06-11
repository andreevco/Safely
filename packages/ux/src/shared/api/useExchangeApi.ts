import { useMemo } from 'react';

import { ExchangeApi } from '@safely/core';

// TODO: ask to support in config
const EXCHANGE_API_URL = 'https://dev-exchange.safely.app';

export function useExchangeApi() {
    return useMemo(() => new ExchangeApi({ baseUrl: EXCHANGE_API_URL }), []);
}
