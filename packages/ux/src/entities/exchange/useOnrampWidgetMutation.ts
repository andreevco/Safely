import { useMutation } from '@tanstack/react-query';

import type { OnrampWidgetRequest, OnrampWidgetResponse } from '@safely/core';

import { useExchangeApi } from '../../shared/api/useExchangeApi';
import { useAppContext } from '../../shared/providers/AppContext';
import { useActiveFiat } from '../fiat';
import { useActiveSignableBtcWallet } from '../portfolio';

export function useOnrampWidgetMutation() {
    const wallet = useActiveSignableBtcWallet();
    const exchangeApi = useExchangeApi(wallet.getAuthorization);
    const { i18n, userCountryInfo } = useAppContext();
    const fiat = useActiveFiat();

    return useMutation<OnrampWidgetResponse, Error, OnrampWidgetRequest>({
        mutationFn: body =>
            exchangeApi.postOnrampWidget(
                {
                    lang: i18n.language,
                    fiat: fiat.id.symbol,
                    storeCountryCode: userCountryInfo?.storeCode,
                    deviceCountryCode: userCountryInfo?.deviceCode
                },
                body
            )
    });
}
