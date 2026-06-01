import type {
    CryptoAssetAmount,
    CryptoCurrencyDisplay,
    FiatAssetAmount,
    FiatCurrencyDisplay
} from '@safely/core';
import { isFiatAssetAmount } from '@safely/core';

import { useNumberFormatter } from './use-number-formatter';

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
