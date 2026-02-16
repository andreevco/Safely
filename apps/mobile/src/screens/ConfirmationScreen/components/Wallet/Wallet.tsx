import { FC, useMemo } from 'react';
import { View } from 'react-native';

import { ellipsisMiddle, Recipient } from '@safely/core';
import type { PortfolioMeta } from '@safely/core';
import { usePortfolios } from '@safely/ux';

import { PortfolioName } from '@mobile/entities/portfolio/PortfolioName';
import { Text } from '@mobile/shared/ui';

import { styles } from './Wallet.styles';

function findPortfolioMetaByAddress(
    portfolios: ReturnType<typeof usePortfolios>,
    address: string
): PortfolioMeta | undefined {
    return portfolios?.find(p =>
        p.getDerivations().some(d => d.chains.btc.wallets[0]?.address === address)
    )?.meta;
}

export const Wallet: FC<{ address: string } | { recipient: Recipient }> = props => {
    const portfolios = usePortfolios();
    const address = 'address' in props ? props.address : props.recipient.address;

    const meta = useMemo(
        () => findPortfolioMetaByAddress(portfolios, address),
        [address, portfolios]
    );

    if (meta) {
        return (
            <View style={styles.container}>
                <PortfolioName meta={meta} size={12} gap={6} fontVariant="bodyM" />
                <Text variant="bodyM" color="tertiary" numberOfLines={1} style={styles.addressLine}>
                    {ellipsisMiddle(address)}
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text variant="bodyM">{address}</Text>
        </View>
    );
};
