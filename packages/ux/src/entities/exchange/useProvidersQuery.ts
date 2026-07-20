import type { Providers } from '@safely/core';

import { exchangeKeys } from './keys';
import { QUERIES_STALE_TIME, useAppContext, useExchangeApi, usePersistQuery } from '../../shared';
import { useActiveFiat } from '../fiat';

export function useProvidersQuery() {
    const exchangeApi = useExchangeApi();
    const { i18n, userCountryInfo } = useAppContext();
    const fiat = useActiveFiat();

    const params = {
        lang: i18n.language,
        fiat: fiat.id.symbol,
        storeCountryCode: userCountryInfo?.storeCode,
        deviceCountryCode: userCountryInfo?.deviceCode
    };

    return usePersistQuery<Providers>({
        queryKey: exchangeKeys
            .providers(
                exchangeApi.id,
                params.lang,
                params.fiat,
                params.storeCountryCode,
                params.deviceCountryCode
            )
            .toKey(),
        queryFn: () => exchangeApi.getProviders(params),
        staleTime: QUERIES_STALE_TIME.DEFAULT,
        schemaKey: 'exchangeProviders'
    });
}
