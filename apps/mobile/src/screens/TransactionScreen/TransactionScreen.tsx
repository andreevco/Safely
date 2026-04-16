/* eslint-disable no-irregular-whitespace */
import { StaticScreenProps } from '@react-navigation/native';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, View } from 'react-native';

import { BLOCKCHAIN_NAME, BTC_ASSET, ellipsisMiddle } from '@safely/core';
import {
    type BtcActivityItem,
    isBtcTransactionPending,
    useDateFormatter,
    useExplorer,
    useNumberFormatter,
    useRate
} from '@safely/ux';

import { TransactionConfirmationStatusBtc } from '@mobile/screens/TransactionScreen/TransactionConfirmationStatusBtc';
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
    const { t } = useTranslation();
    const isInitiator = activity.transaction.isInitiator;
    const isPending = isBtcTransactionPending(activity.transaction.raw);
    const formatter = useNumberFormatter();
    const { data: rate } = useRate(BTC_ASSET);
    const explorer = useExplorer(BLOCKCHAIN_NAME.BTC);
    const dateFormatter = useDateFormatter({
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });

    const handleCopy = useCopy();
    const handleOpen = useCallback(() => {
        const url = explorer.transaction(activity.transaction.raw.txid);
        void Linking.openURL(url);
    }, [activity.transaction.raw.txid, explorer]);

    const confirmedAt = useMemo(
        () => dateFormatter.format(activity.timestamp),
        [dateFormatter, activity.timestamp]
    );

    const addressCell = useMemo(() => {
        return {
            address: isInitiator
                ? activity.transaction.toAddress
                : activity.transaction.fromAddress,
            label: isInitiator
                ? t('history.transactionInfo.recipient')
                : t('history.transactionInfo.sender')
        };
    }, [isInitiator, activity.transaction.toAddress, activity.transaction.fromAddress, t]);

    return (
        <Screen>
            <Screen.Header>
                <Screen.Header.BackButton />
                <Screen.Header.Title>
                    <Text variant="titleS" color="primary" textAlign="center">
                        {isInitiator
                            ? t(
                                  isPending
                                      ? 'history.transactionInfo.sending'
                                      : 'history.transactionInfo.sent'
                              )
                            : t(
                                  isPending
                                      ? 'history.transactionInfo.receiving'
                                      : 'history.transactionInfo.received'
                              )}
                    </Text>
                    {!isPending && (
                        <Text variant="bodyM" color="secondary" textAlign="center">
                            {confirmedAt}
                        </Text>
                    )}
                </Screen.Header.Title>
            </Screen.Header>
            <Screen.Scrollable>
                <View style={styles.amountContainer}>
                    <Text variant="titleL" color="primary">
                        {isInitiator ? '−' : '+'} {activity.transaction.value.format(formatter)}
                    </Text>
                    {rate && (
                        <Text variant="bodyL" color="secondary">
                            ≈ {activity.transaction.value.convert(rate).format(formatter)}
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
                            <TransactionConfirmationStatusBtc tx={activity.transaction.raw} />
                        </TableCell>
                    </List.Group>
                    <List.Group withoutBottomMargin>
                        <TableCell>
                            <TableCell.Column leading>
                                <TableCell.Label>
                                    {t('history.transactionInfo.fee')}
                                </TableCell.Label>
                            </TableCell.Column>
                            <TableCell.Column>
                                <TableCell.Value>
                                    {!rate || !activity.transaction.fee ? (
                                        '-'
                                    ) : (
                                        <>
                                            {activity.transaction.fee.amount
                                                .convert(rate)
                                                .format(formatter)}{' '}
                                            <TableCell.Value color="secondary">
                                                {activity.transaction.fee.amount.format(formatter)}
                                            </TableCell.Value>
                                        </>
                                    )}
                                </TableCell.Value>
                            </TableCell.Column>
                        </TableCell>
                        <TableCell>
                            <TableCell.Column leading>
                                <TableCell.Label>
                                    {t('history.transactionInfo.hash')}
                                </TableCell.Label>
                            </TableCell.Column>
                            <TableCell.Column>
                                <TableCell.Value>
                                    {ellipsisMiddle(activity.transaction.raw?.txid, 8)}
                                </TableCell.Value>
                            </TableCell.Column>
                            <View style={styles.iconsContainer}>
                                <TouchableOpacity hitSlop={12} onPress={handleOpen}>
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
            </Screen.Scrollable>
        </Screen>
    );
};
