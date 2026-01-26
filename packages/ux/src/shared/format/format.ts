import { useMemo } from 'react';

import { CryptoAssetAmount, FiatAssetAmount, isFiatAssetAmount } from '@safely/core/entities';
import {
    CryptoCurrencyDisplay,
    FiatCurrencyDisplay,
    NumberFormatter,
    WebNumberFormatLocale
} from '@safely/core/utils';

import { useAppContext } from '../providers';

function useNumberFormatLocale(): WebNumberFormatLocale {
    const { i18n } = useAppContext();
    return useMemo(() => new WebNumberFormatLocale(i18n.language), [i18n.language]);
}

export function useNumberFormatter(): NumberFormatter {
    const locale = useNumberFormatLocale();
    return useMemo(() => new NumberFormatter(locale), [locale]);
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
