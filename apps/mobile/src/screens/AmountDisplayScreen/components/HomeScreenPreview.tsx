import { BTC_ASSET, CryptoAssetAmount } from '@safely/core';
import { useActivePortfolioRate, useActiveWalletBtcBalance } from '@safely/ux';

import { BtcAssetCell } from '@mobile/entities/asset';

const DEMO_BALANCE = new CryptoAssetAmount({ relativeAmount: 0.25, asset: BTC_ASSET });

export const HomeScreenPreview = () => {
    const balance = useActiveWalletBtcBalance();
    const rate = useActivePortfolioRate(BTC_ASSET);

    const displayBalance = balance.data?.display;
    const amount = displayBalance && displayBalance.weiAmount > 0n ? displayBalance : DEMO_BALANCE;

    return (
        <BtcAssetCell
            cryptoAssetAmount={amount}
            price={rate.data ?? null}
            showDivider={false}
            background="tertiary"
        />
    );
};
