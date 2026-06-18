import { useMemo } from 'react';

import type { RequestSigner } from '@safely/core';
import { ExchangeApi } from '@safely/core';

import { useBootConfig } from './useBootConfig';

export function useExchangeApi(signer?: RequestSigner) {
    const { exchange } = useBootConfig();

    return useMemo(
        () => new ExchangeApi({ baseUrl: exchange.url, signer }),
        [exchange.url, signer]
    );
}
