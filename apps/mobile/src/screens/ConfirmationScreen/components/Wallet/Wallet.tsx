import type { FC } from 'react';
import { View } from 'react-native';

import { ellipsisMiddle } from '@safely/core';
import type { RecipientMeta } from '@safely/ux';

import { ContactName } from '@mobile/entities/contact';
import { PortfolioName } from '@mobile/entities/portfolio/PortfolioName';
import { Text } from '@mobile/shared/ui';

import { styles } from './Wallet.styles';

interface WalletProps {
    address: string;
    meta?: RecipientMeta;
}

export const Wallet: FC<WalletProps> = props => {
    const { address, meta } = props;

    if (meta) {
        return (
            <View style={styles.container}>
                {meta.kind === 'contact' ? (
                    <ContactName meta={meta.meta} size={12} gap={6} fontVariant="bodyM" />
                ) : (
                    <PortfolioName meta={meta.meta} size={12} gap={6} fontVariant="bodyM" />
                )}
                <Text variant="bodyM" color="tertiary" numberOfLines={1}>
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
