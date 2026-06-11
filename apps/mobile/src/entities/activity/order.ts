import type { Providers, RampOrder } from '@safely/core';
import { BTC_ASSET, CryptoAssetAmount } from '@safely/core';
import type { useNumberFormatter } from '@safely/ux';

type NumberFormatter = ReturnType<typeof useNumberFormatter>;

const capitalize = (value: string) => (value ? value[0].toUpperCase() + value.slice(1) : value);

export function getOrderProviderName(order: RampOrder, providers: Providers | undefined): string {
    const meta = providers?.providers.find(p => p.info.id === order.provider);
    return meta?.info.name ?? capitalize(order.provider);
}

export function formatOrderCrypto(order: RampOrder, formatter: NumberFormatter): string {
    return new CryptoAssetAmount({
        asset: BTC_ASSET,
        relativeAmount: order.cryptoAmount
    }).format(formatter);
}

export function formatOrderFiat(order: RampOrder, formatter: NumberFormatter): string | null {
    try {
        return formatter.formatFiat(order.fiatAmount, { currency: order.fiatCurrency });
    } catch {
        return null;
    }
}
