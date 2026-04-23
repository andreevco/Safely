import { FC, useMemo } from 'react';
import { View } from 'react-native';

import { ellipsisMiddle, Recipient } from '@safely/core';
import {
    findPortfolioMetaByAddress,
    usePortfolios,
    useContacts,
    findContactMetaByAddress
} from '@safely/ux';

import { ContactName } from '@mobile/entities/contact';
import { PortfolioName } from '@mobile/entities/portfolio/PortfolioName';
import { Text } from '@mobile/shared/ui';

import { styles } from './Wallet.styles';

export const Wallet: FC<{ address: string } | { recipient: Recipient }> = props => {
    const portfolios = usePortfolios();
    const contacts = useContacts();
    const address = 'address' in props ? props.address : props.recipient.address;

    const portfolioMeta = useMemo(
        () => findPortfolioMetaByAddress(portfolios, address),
        [address, portfolios]
    );
    const contactMeta = useMemo(
        () => findContactMetaByAddress(contacts, props.recipient.blockchain, address),
        [address, contacts, props.recipient.blockchain]
    );

    if (portfolioMeta || contactMeta) {
        return (
            <View style={styles.container}>
                {contactMeta ? (
                    <ContactName meta={contactMeta} size={12} gap={6} fontVariant="bodyM" />
                ) : (
                    portfolioMeta && (
                        <PortfolioName meta={portfolioMeta} size={12} gap={6} fontVariant="bodyM" />
                    )
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
