import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { ellipsisMiddle, PortfolioNetworkType } from '@safely/core';
import type { RecipientMeta } from '@safely/ux';

import { ContactName } from '@mobile/entities/contact';
import { PortfolioName } from '@mobile/entities/portfolio/PortfolioName';
import { Badge, Text } from '@mobile/shared/ui';

import { styles } from './Wallet.styles';

interface WalletProps {
    address: string;
    meta?: RecipientMeta;
    networkType?: PortfolioNetworkType;
}

export const Wallet: FC<WalletProps> = props => {
    const { address, meta, networkType } = props;
    const { t } = useTranslation();

    const isTestnet = networkType === PortfolioNetworkType.TESTNET;

    const testnetBadge = isTestnet ? (
        <Badge type="neutral" isUppercase>
            {t('portfolio.testnet')}
        </Badge>
    ) : null;

    if (meta) {
        return (
            <View style={styles.container}>
                {meta.kind === 'contact' ? (
                    <View style={styles.row}>
                        <ContactName meta={meta.meta} size={12} gap={6} fontVariant="bodyM" />
                        {testnetBadge}
                    </View>
                ) : (
                    <View style={styles.row}>
                        <PortfolioName
                            meta={meta.meta}
                            size={12}
                            gap={6}
                            fontVariant="bodyM"
                            networkType={networkType}
                        />
                        {meta.tag !== undefined && <Badge>{String(meta.tag)}</Badge>}
                    </View>
                )}
                <Text variant="bodyM" color="tertiary" numberOfLines={1}>
                    {ellipsisMiddle(address)}
                </Text>
            </View>
        );
    }

    if (isTestnet) {
        return (
            <View style={styles.container}>
                <View style={styles.row}>
                    <Text variant="bodyM" numberOfLines={1} style={styles.address}>
                        {ellipsisMiddle(address)}
                    </Text>
                    {testnetBadge}
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text variant="bodyM">{address}</Text>
        </View>
    );
};
