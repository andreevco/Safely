import { BTC_ASSET, CryptoFiatRate } from '@safely/core';
import { useActivePortfolioRate } from '@safely/ux';

export function BtcPriceBadge() {
    const {
        data: rate,
        isLoading,
        error
    } = useActivePortfolioRate(BTC_ASSET) as {
        data: CryptoFiatRate | null | undefined;
        isLoading: boolean;
        error: Error | null;
    };

    if (isLoading) {
        return (
            <div className="inline-flex items-center gap-2 rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-500">
                Loading BTC price...
            </div>
        );
    }

    if (error) {
        return (
            <div className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                Error: {error.message}
            </div>
        );
    }

    if (!rate) {
        return (
            <div className="inline-flex items-center gap-2 rounded-lg bg-yellow-50 px-3 py-2 text-sm text-yellow-700">
                Price unavailable
            </div>
        );
    }

    const priceFormatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(rate.value.toNumber());

    const diff24h = rate.diff24h ? parseFloat(rate.diff24h) : null;
    const isPositive = diff24h !== null && diff24h >= 0;

    return (
        <div className="inline-flex items-center gap-2 rounded-lg bg-zinc-100 px-3 py-2">
            <span className="text-sm font-medium text-zinc-900">BTC {priceFormatted}</span>
            {diff24h !== null && (
                <span
                    className={`text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}
                >
                    {isPositive ? '+' : ''}
                    {diff24h.toFixed(2)}%
                </span>
            )}
        </div>
    );
}
