import { useMutation } from '@tanstack/react-query';

import type { OnrampWidgetResponse, Provider } from '@safely/core';

import { useExchangeApi } from '../../shared/api/useExchangeApi';
import { useUserCountryInfo } from '../../shared/api/useUserCountryInfo';
import { useAppContext } from '../../shared/providers/AppContext';
import { useActiveFiat } from '../fiat';
import { useActiveBtcWallet } from '../portfolio';
import { useReadOnlyRequestSigner } from './useReadOnlyRequestSigner';

export function useOnrampWidgetMutation() {
    const wallet = useActiveBtcWallet();
    const signer = useReadOnlyRequestSigner();
    const exchangeApi = useExchangeApi(signer);
    const { i18n } = useAppContext();
    const userCountryInfo = useUserCountryInfo();
    const fiat = useActiveFiat();

    return useMutation<OnrampWidgetResponse, Error, Provider>({
        mutationFn: (provider: Provider) =>
            exchangeApi.postOnrampWidget(
                {
                    lang: i18n.language,
                    fiat: fiat.id.symbol,
                    storeCountryCode: userCountryInfo.storeCode,
                    deviceCountryCode: userCountryInfo.deviceCode
                },
                {
                    provider: provider.info.id,
                    // TODO: remove hardcoded on multichain
                    blockchain: 'bitcoin',
                    token: 'native',
                    address: wallet.address
                }
            )
    });
}
