import type { CryptoAssetAmount } from '@safely/core';

type SentAmountParams = {
    isInitiator: boolean;
    value: CryptoAssetAmount;
    fee: CryptoAssetAmount | undefined;
    showFullSentAmount: boolean;
};

export type DisplayedCryptoAmount = {
    amount: CryptoAssetAmount;
    isFullPrecision: boolean;
};

export function resolveSentAmount(params: SentAmountParams): DisplayedCryptoAmount {
    const { isInitiator, value, fee, showFullSentAmount } = params;

    if (!isInitiator || !showFullSentAmount) {
        return { amount: value, isFullPrecision: false };
    }

    return { amount: fee ? value.add(fee) : value, isFullPrecision: true };
}
