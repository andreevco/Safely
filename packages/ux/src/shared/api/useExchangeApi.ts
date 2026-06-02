import { useMemo } from 'react';

import { ExchangeApi, type AuthorizationProvider } from '@safely/core';

// TODO: ask to support in config
const EXCHANGE_API_URL = 'https://dev-exchange.safely.app';

export function useExchangeApi(getAuthorization?: AuthorizationProvider) {
    return useMemo(
        () => new ExchangeApi({ baseUrl: EXCHANGE_API_URL, getAuthorization }),
        [getAuthorization]
    );
}
