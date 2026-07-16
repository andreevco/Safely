import type { StaticScreenProps } from '@react-navigation/native';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { BLOCKCHAIN_NAME, BTC_ASSET, SPACE, ellipsisMiddle } from '@safely/core';
import type { OrderActivityItem } from '@safely/ux';
import {
    useDateFormatter,
    useExplorer,
    useLinking,
    useNumberFormatter,
    useProvidersQuery,
    useActivePortfolioRate,
    resolveAssetByBlockchainAndToken,
    isBtcTransactionPending
} from '@safely/ux';

import { OrderStatus } from '@mobile/entities/activity';
import {
    ArrowTop16,
    Button,
    Copy16,
    Globe16,
    Icon,
    Image,
    List,
    Plus16,
    Screen,
    TableCell,
    Text,
    TouchableOpacity
} from '@mobile/shared/ui';

import { styles } from './OrderScreen.styles';

type OrderScreenProps = StaticScreenProps<{
    order: OrderActivityItem;
}>;

export const OrderScreen = (props: OrderScreenProps) => {
    const { order } = props.route.params;
    const { t } = useTranslation();
    const explorer = useExplorer(BLOCKCHAIN_NAME.BTC);
    const { openURL } = useLinking();
    const { data: providers } = useProvidersQuery();
    const dateFormatter = useDateFormatter({
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });

    const handleOpenExplorer = useCallback(() => {
        if (order.order.txHash) {
            openURL(explorer.transaction(order.order.txHash));
        }
    }, [order.order.txHash, explorer, openURL]);

    const provider = providers?.providers.find(p => p.info.id === order.order.provider);
    const txHash = order.order.txHash;
    const providerName = provider?.info.name;
    const supportUrl = provider?.info.support.url;

    const { data: rate } = useActivePortfolioRate(
        resolveAssetByBlockchainAndToken(order.order.blockchain, order.order.token)
    );
    const formatter = useNumberFormatter();

    const formattedFiatAmount = order.order.fiatAmount
        ? formatter.formatFiat(order.order.fiatAmount, {
              currency: order.order.fiatCurrency,
              currencyDisplay: 'code',
              useGrouping: true
          })
        : null;

    const formattedCryptoAmount = order.cryptoAmount?.format(formatter);

    const isConfirmed = !!order.transaction && !isBtcTransactionPending(order.transaction.raw);

    return (
        <Screen>
            <Screen.Header>
                <Screen.Header.BackButton />
                <Screen.Header.Title>
                    <Text variant="titleS" color="primary" textAlign="center">
                        {order.order.type === 'offramp'
                            ? t('history.orderInfo.sale.default')
                            : t('history.orderInfo.purchase.default')}
                    </Text>
                    {isConfirmed && (
                        <Text variant="bodyM" color="secondary" textAlign="center">
                            {dateFormatter.format(order.timestamp)}
                        </Text>
                    )}
                </Screen.Header.Title>
            </Screen.Header>
            <Screen.Scrollable>
                <View style={styles.headerContainer}>
                    <View style={styles.assetImageContainer}>
                        <Image source={BTC_ASSET.image} style={styles.assetImage} />
                        <View style={styles.assetBadge}>
                            <Icon
                                icon={order.order.type === 'offramp' ? ArrowTop16 : Plus16}
                                color="primary"
                            />
                        </View>
                    </View>
                    <View style={styles.amountContainer}>
                        {formattedCryptoAmount && (
                            <Text variant="titleL" color="primary" textAlign="center">
                                {order.order.type === 'offramp' ? '−' : '+'}
                                {SPACE.THSP}
                                {formattedCryptoAmount}
                            </Text>
                        )}
                        {rate && order.cryptoAmount && (
                            <Text variant="bodyL" color="secondary" textAlign="center">
                                ≈{SPACE.THSP}
                                {order.cryptoAmount
                                    .convert(rate)
                                    .format(formatter, { currencyDisplay: 'code' })}
                            </Text>
                        )}
                    </View>
                </View>
                <List style={styles.list}>
                    <List.Group withoutBottomMargin>
                        <TableCell>
                            <TableCell.Column leading>
                                <TableCell.Label>{t('history.orderInfo.provider')}</TableCell.Label>
                            </TableCell.Column>
                            <TableCell.Column>
                                <TableCell.Value>{providerName}</TableCell.Value>
                            </TableCell.Column>
                        </TableCell>
                        <OrderStatus order={order} />
                    </List.Group>
                    <List.Group withoutBottomMargin>
                        {formattedFiatAmount && (
                            <TableCell>
                                <TableCell.Column leading>
                                    <TableCell.Label>
                                        {order.order.type === 'onramp'
                                            ? t('history.orderInfo.paid')
                                            : t('history.orderInfo.received')}
                                    </TableCell.Label>
                                </TableCell.Column>
                                <TableCell.Column>
                                    <TableCell.Value>{formattedFiatAmount}</TableCell.Value>
                                </TableCell.Column>
                            </TableCell>
                        )}
                        <TableCell copyable={order.order.id}>
                            {({ handleCopy }) => (
                                <>
                                    <TableCell.Column leading>
                                        <TableCell.Label>
                                            {t('history.orderInfo.order')}
                                        </TableCell.Label>
                                    </TableCell.Column>
                                    <TableCell.Column>
                                        <TableCell.Value>
                                            {ellipsisMiddle(order.order.id, 6)}
                                        </TableCell.Value>
                                    </TableCell.Column>
                                    <View style={styles.iconsContainer}>
                                        <TouchableOpacity hitSlop={12} onPress={() => handleCopy()}>
                                            <Icon icon={Copy16} color="secondary" />
                                        </TouchableOpacity>
                                    </View>
                                </>
                            )}
                        </TableCell>
                    </List.Group>
                    {!!txHash && (
                        <List.Group withoutBottomMargin>
                            <TableCell copyable={txHash}>
                                {({ handleCopy }) => (
                                    <>
                                        <TableCell.Column leading>
                                            <TableCell.Label>
                                                {t('history.orderInfo.transaction')}
                                            </TableCell.Label>
                                        </TableCell.Column>
                                        <TableCell.Column>
                                            <TableCell.Value>
                                                {ellipsisMiddle(txHash, 8)}
                                            </TableCell.Value>
                                        </TableCell.Column>
                                        <View style={styles.iconsContainer}>
                                            <TouchableOpacity
                                                hitSlop={12}
                                                onPress={handleOpenExplorer}
                                            >
                                                <Icon icon={Globe16} color="secondary" />
                                            </TouchableOpacity>
                                            <TouchableOpacity hitSlop={12} onPress={handleCopy}>
                                                <Icon icon={Copy16} color="secondary" />
                                            </TouchableOpacity>
                                        </View>
                                    </>
                                )}
                            </TableCell>
                        </List.Group>
                    )}
                    {!!supportUrl && (
                        <View style={styles.supportContainer}>
                            <Button
                                type="secondary"
                                size="small"
                                onPress={() => openURL(supportUrl)}
                            >
                                {t('history.orderInfo.support')}
                            </Button>
                        </View>
                    )}
                </List>
            </Screen.Scrollable>
        </Screen>
    );
};
