import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import type { PortfolioMeta } from '@safely/core';

import type { TextProps } from '@mobile/shared/ui';
import { Badge, Text } from '@mobile/shared/ui';

import { styles } from './PortfolioName.styles';

type WatchOnlyBadgeType = ComponentProps<typeof Badge>['type'];

type PortfolioNameProps = {
    meta: PortfolioMeta;
    size?: number;
    gap?: number;
    fontVariant?: TextProps['variant'];
    color?: TextProps['color'];
    tag?: number | false;
    isWatchOnly?: boolean;
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
        isWatchOnly,
        watchOnlyBadgeType = 'neutral'
    } = props;
    const { t } = useTranslation();

    switch (meta.icon.type) {
        case 'color':
            return (
                <View style={styles.contentWithTag}>
                    <View style={styles.container(gap)}>
                        <View style={styles.dot(meta.icon.value, size)} />
                        <Text
                            variant={fontVariant}
                            color={color}
                            numberOfLines={1}
                            style={styles.name}
                        >
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
                    {isWatchOnly && (
                        <Badge type={watchOnlyBadgeType} isUppercase>
                            {t('portfolio.watchOnly')}
                        </Badge>
                    )}
                </View>
            );
        case 'emoji':
            return (
                <View style={styles.contentWithTag}>
                    <View style={styles.container(gap)}>
                        <View style={styles.emojiContainer(size)}>
                            <Text style={styles.emoji(size)}>{meta.icon.value}</Text>
                        </View>
                        <Text
                            variant={fontVariant}
                            color={color}
                            numberOfLines={1}
                            style={styles.name}
                        >
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
                    {isWatchOnly && (
                        <Badge type={watchOnlyBadgeType} isUppercase>
                            {t('portfolio.watchOnly')}
                        </Badge>
                    )}
                </View>
            );
        default:
            return null;
    }
};
