import { defineQueryKeys, finalKey } from '../../shared';

export const exchangeKeys = defineQueryKeys('exchange', {
    providers: (
        _apiId: string,
        _lang: string,
        _fiat: string,
        _storeCountryCode?: string | null,
        _deviceCountryCode?: string | null
    ) => finalKey
});

export const dismissedProvidersKeys = defineQueryKeys('dismissedProviders', {
    ids: finalKey
});
