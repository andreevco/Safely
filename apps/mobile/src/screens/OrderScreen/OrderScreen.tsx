import type { StaticScreenProps } from '@react-navigation/native';
import type { InfiniteData } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import type { RampOrder } from '@safely/core';
import { BLOCKCHAIN_NAME, BTC_ASSET, ellipsisMiddle } from '@safely/core';
import {
    isOrderActivityItem,
    useDateFormatter,
    useExplorer,
    useHistory,
    useLinking,
    useNumberFormatter,
    useProvidersQuery
} from '@safely/ux';
import type { ActivityPage, IActivityPageParam } from '@safely/ux';

import {
    formatOrderCrypto,
    formatOrderFiat,
    getOrderProviderName
} from '@mobile/entities/activity';
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
    order: RampOrder;
}>;

export const OrderScreen = (props: OrderScreenProps) => {
    const { order: orderParam } = props.route.params;
    const { data: liveOrder } = useHistory<RampOrder | undefined>(
        {},
        {
            select: useCallback(
                (data: InfiniteData<ActivityPage, IActivityPageParam>) =>
                    data.pages
                        .flatMap(page => page.items)
                        .filter(isOrderActivityItem)
                        .find(item => item.order.id === orderParam.id)?.order,
                [orderParam.id]
            )
        }
    );
    const order = liveOrder ?? orderParam;
    const { t } = useTranslation();
    const formatter = useNumberFormatter();
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
        if (order.txHash) {
            openURL(explorer.transaction(order.txHash));
        }
    }, [order.txHash, explorer, openURL]);

    const handleSupport = useCallback(() => {
        openURL(order.supportDetails);
    }, [order.supportDetails, openURL]);

    const fiatLabel = formatOrderFiat(order, formatter);

    return (
        <Screen>
            <Screen.Header>
                <Screen.Header.BackButton />
                <Screen.Header.Title>
                    <Text variant="titleS" color="primary" textAlign="center">
                        {order.type === 'offramp'
                            ? t('history.orderInfo.sale')
                            : t('history.orderInfo.purchase')}
                    </Text>
                    <Text variant="bodyM" color="secondary" textAlign="center">
                        {dateFormatter.format(order.createdAt * 1000)}
                    </Text>
                </Screen.Header.Title>
            </Screen.Header>
            <Screen.Scrollable>
                <View style={styles.headerContainer}>
                    <View style={styles.assetImageContainer}>
                        <Image source={BTC_ASSET.image} style={styles.assetImage} />
                        <View style={styles.assetBadge}>
                            <Icon
                                icon={order.type === 'offramp' ? ArrowTop16 : Plus16}
                                color="primary"
                            />
                        </View>
                    </View>
                    <View style={styles.amountContainer}>
                        <Text variant="titleL" color="primary" textAlign="center">
                            {order.type === 'offramp' ? '−' : '+'}{' '}
                            {formatOrderCrypto(order, formatter)}
                        </Text>
                        {fiatLabel !== null && (
                            <Text variant="bodyL" color="secondary" textAlign="center">
                                ≈ {fiatLabel}
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
                                <TableCell.Value>
                                    {getOrderProviderName(order, providers)}
                                </TableCell.Value>
                            </TableCell.Column>
                        </TableCell>
                    </List.Group>
                    <List.Group withoutBottomMargin>
                        <TableCell copyable={order.id}>
                            <TableCell.Column leading>
                                <TableCell.Label>{t('history.orderInfo.order')}</TableCell.Label>
                            </TableCell.Column>
                            <TableCell.Column>
                                <TableCell.Value>#{ellipsisMiddle(order.id, 6)}</TableCell.Value>
                            </TableCell.Column>
                        </TableCell>
                    </List.Group>
                    {!!order.txHash && (
                        <List.Group withoutBottomMargin>
                            <TableCell copyable={order.txHash}>
                                {({ handleCopy }) => (
                                    <>
                                        <TableCell.Column leading>
                                            <TableCell.Label>
                                                {t('history.orderInfo.transaction')}
                                            </TableCell.Label>
                                        </TableCell.Column>
                                        <TableCell.Column>
                                            <TableCell.Value>
                                                {ellipsisMiddle(order.txHash ?? '', 8)}
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
                    {!!order.supportDetails && (
                        <View style={styles.supportContainer}>
                            <Button type="secondary" size="small" onPress={handleSupport}>
                                {t('history.orderInfo.support')}
                            </Button>
                        </View>
                    )}
                </List>
            </Screen.Scrollable>
        </Screen>
    );
};
