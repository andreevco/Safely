import { useMemo } from 'react';

import {
    CryptoAssetAmount,
    FiatAssetAmount,
    isFiatAssetAmount,
    CryptoCurrencyDisplay,
    FiatCurrencyDisplay,
    NumberFormatter
} from '@safely/core';

import { useAppContext } from '../providers';

export function useNumberFormatter() {
    const { numberFormatLocale, loggerRegistry } = useAppContext();
    return useMemo(
        () => new NumberFormatter(numberFormatLocale, loggerRegistry.systemLogger),
        [numberFormatLocale, loggerRegistry]
    );
}

export function useFormattedAmount(
    assetAmount: CryptoAssetAmount | undefined,
    options?: { fullPrecision?: boolean; currencyDisplay?: CryptoCurrencyDisplay }
): string | undefined;
export function useFormattedAmount(
    assetAmount: FiatAssetAmount | undefined,
    options?: { fullPrecision?: boolean; currencyDisplay?: FiatCurrencyDisplay }
): string | undefined;
export function useFormattedAmount(
    assetAmount: FiatAssetAmount | CryptoAssetAmount | undefined,
    options?: {
        fullPrecision?: boolean;
        currencyDisplay?: FiatCurrencyDisplay | CryptoCurrencyDisplay;
    }
): string | undefined {
    const formatter = useNumberFormatter();

    if (!assetAmount) {
        return undefined;
    }

    if (isFiatAssetAmount(assetAmount)) {
        return assetAmount.format(
            formatter,
            options as { fullPrecision?: boolean; currencyDisplay?: FiatCurrencyDisplay }
        );
    }

    return assetAmount.format(
        formatter,
        options as { fullPrecision?: boolean; currencyDisplay?: CryptoCurrencyDisplay }
    );
}
