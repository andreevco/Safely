import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import type { PortfolioMeta } from '@safely/core';
import { PortfolioNetworkType, PortfolioType } from '@safely/core';

import type { TextProps } from '@mobile/shared/ui';
import { Badge, Text } from '@mobile/shared/ui';

import { styles } from './PortfolioName.styles';

type WatchOnlyBadgeType = ComponentProps<typeof Badge>['type'];

const BADGE_LABEL_BY_TYPE: Partial<Record<PortfolioType, string>> = {
    [PortfolioType.WATCH_ONLY]: 'portfolio.watchOnly',
    [PortfolioType.LEDGER]: 'portfolio.ledger'
};

type PortfolioNameProps = {
    meta: PortfolioMeta;
    size?: number;
    gap?: number;
    fontVariant?: TextProps['variant'];
    color?: TextProps['color'];
    tag?: number | false;
    type?: PortfolioType;
    networkType?: PortfolioNetworkType;
    watchOnlyBadgeType?: WatchOnlyBadgeType;
};

export const PortfolioName = (props: PortfolioNameProps) => {
    const {
        meta,
        size = 12,
        gap = 6,
        fontVariant = 'labelL',
        color,
        tag,
        type,
        networkType,
        watchOnlyBadgeType = 'neutral'
    } = props;
    const { t } = useTranslation();

    const badgeLabelKey = type ? BADGE_LABEL_BY_TYPE[type] : undefined;
    const badgeLabel = badgeLabelKey ? t(badgeLabelKey) : null;
    const isTestnet = networkType === PortfolioNetworkType.TESTNET;

    const icon =
        meta.icon.type === 'color' ? (
            <View style={styles.dot(meta.icon.value, size)} />
        ) : meta.icon.type === 'emoji' ? (
            <View style={styles.emojiContainer(size)}>
                <Text style={styles.emoji(size)}>{meta.icon.value}</Text>
            </View>
        ) : null;

    if (!icon) return null;

    return (
        <View style={styles.contentWithTag}>
            <View style={styles.container(gap)}>
                {icon}
                <Text variant={fontVariant} color={color} numberOfLines={1} style={styles.name}>
                    {meta.name}
                </Text>
            </View>
            {tag && (
                <View style={styles.tag}>
                    <Text variant="bodyS" color="secondary">
                        #{tag}
                    </Text>
                </View>
            )}
            {badgeLabel && (
                <Badge type={watchOnlyBadgeType} isUppercase>
                    {badgeLabel}
                </Badge>
            )}
            {isTestnet && (
                <Badge type="neutral" isUppercase>
                    {t('portfolio.testnet')}
                </Badge>
            )}
        </View>
    );
};
