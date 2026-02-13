/* eslint-disable no-irregular-whitespace */
import { StaticScreenProps } from '@react-navigation/native';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { BTC_ASSET, CryptoAssetAmount, ellipsisMiddle } from '@safely/core';
import { type BtcActivityItem, useNumberFormatter, useRate } from '@safely/ux';

import {
    Copy16,
    Globe16,
    Icon,
    List,
    Screen,
    TableCell,
    Text,
    TouchableOpacity
} from '@mobile/shared/ui';
import { useCopy } from '@mobile/shared/utils/copy';

import { styles } from './TransactionScreen.styles';

type TransactionScreenProps = StaticScreenProps<{
    activity: BtcActivityItem;
}>;

export const TransactionScreen = (props: TransactionScreenProps) => {
    const {
        route: {
            params: { activity }
        }
    } = props;
    const { t, i18n } = useTranslation();
    const isInitiator = activity.transaction.isInitiator;
    const formatter = useNumberFormatter();
    const rate = useRate(BTC_ASSET);
    const handleCopy = useCopy();

    const confirmedAt = useMemo(() => {
        return new Date(activity.timestamp).toLocaleDateString(i18n.language, {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    }, [activity.timestamp, i18n.language]);

    const addressCell = useMemo(() => {
        return {
            address: isInitiator
                ? activity.transaction.toAddress
                : activity.transaction.fromAddress,
            label: isInitiator ? t('transaction.recipient') : t('transaction.sender')
        };
    }, [isInitiator, activity.transaction.toAddress, activity.transaction.fromAddress, t]);

    const networkFee = useMemo(() => {
        const feeCryptoAmount = new CryptoAssetAmount({
            asset: BTC_ASSET,
            weiAmount: activity.transaction.raw?.fees ?? 0n
        });

        return {
            cryptoFormatted: feeCryptoAmount.format(formatter),
            fiatFormatted: rate.data ? feeCryptoAmount.convert(rate.data).format(formatter) : '-'
        };
    }, [activity.transaction.raw?.fees, formatter, rate.data]);

    console.log(activity.transaction.raw);

    return (
        <Screen>
            <Screen.Header>
                <Screen.Header.BackButton />
                <Screen.Header.Title>
                    <Text variant="titleS" color="primary" textAlign="center">
                        {isInitiator ? t('transaction.sent') : t('transaction.received')}
                    </Text>
                    <Text variant="bodyM" color="secondary" textAlign="center">
                        {confirmedAt}
                    </Text>
                </Screen.Header.Title>
            </Screen.Header>
            <Screen.Content>
                <View style={styles.amountContainer}>
                    <Text variant="titleL" color="primary">
                        {isInitiator ? '−' : '+'} {activity.transaction.value.format(formatter)}
                    </Text>
                    {rate.data && (
                        <Text variant="bodyL" color="secondary">
                            ≈ {activity.transaction.value.convert(rate.data).format(formatter)}
                        </Text>
                    )}
                </View>
                <List style={styles.list}>
                    <List.Group withoutBottomMargin>
                        <TableCell onPress={() => handleCopy(addressCell.address)}>
                            <TableCell.Column leading>
                                <TableCell.Label>{addressCell.label}</TableCell.Label>
                            </TableCell.Column>
                            <TableCell.Column>
                                <TableCell.Value>
                                    {ellipsisMiddle(addressCell.address, 6)}
                                </TableCell.Value>
                            </TableCell.Column>
                        </TableCell>
                        <TableCell>
                            <TableCell.Column leading>
                                <TableCell.Label>{t('transaction.status')}</TableCell.Label>
                            </TableCell.Column>
                            <TableCell.Column>
                                <TableCell.Value>
                                    {t('transaction.confirmed', {
                                        timestamp: confirmedAt
                                    })}
                                </TableCell.Value>
                            </TableCell.Column>
                        </TableCell>
                    </List.Group>
                    <List.Group withoutBottomMargin>
                        <TableCell>
                            <TableCell.Column leading>
                                <TableCell.Label>{t('transaction.fee')}</TableCell.Label>
                            </TableCell.Column>
                            <TableCell.Column>
                                <TableCell.Value>
                                    {networkFee.fiatFormatted}{' '}
                                    <TableCell.Value color="secondary">
                                        {networkFee.cryptoFormatted}
                                    </TableCell.Value>
                                </TableCell.Value>
                            </TableCell.Column>
                        </TableCell>
                        <TableCell>
                            <TableCell.Column leading>
                                <TableCell.Label>{t('transaction.hash')}</TableCell.Label>
                            </TableCell.Column>
                            <TableCell.Column>
                                <TableCell.Value>
                                    {ellipsisMiddle(activity.transaction.raw?.txid, 6)}
                                </TableCell.Value>
                            </TableCell.Column>
                            <View style={styles.iconsContainer}>
                                <TouchableOpacity hitSlop={12}>
                                    <Icon icon={Globe16} color="secondary" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => handleCopy(activity.transaction.raw?.txid ?? '')}
                                    hitSlop={12}
                                >
                                    <Icon icon={Copy16} color="secondary" />
                                </TouchableOpacity>
                            </View>
                        </TableCell>
                    </List.Group>
                </List>
            </Screen.Content>
        </Screen>
    );
};
