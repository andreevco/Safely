import { useTranslation } from 'react-i18next';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { ellipsisMiddle, type PortfolioMeta } from '@safely/core';
import type { AmountView } from '@safely/ux';

import { Text } from '@mobile/shared/ui';

import { styles } from './HeaderSubtitle.styles';

const FADE_DURATION_MS = 150;

export const RecipientHeaderSubtitle = ({ fromMeta }: { fromMeta: PortfolioMeta }) => {
    const { t } = useTranslation();

    return (
        <Animated.View
            entering={FadeIn.duration(FADE_DURATION_MS)}
            exiting={FadeOut.duration(FADE_DURATION_MS)}
            style={styles.row}
        >
            <Text variant="bodyM" color="secondary">
                {t('send.from')}
            </Text>
            <Text variant="bodyM" color="secondary" numberOfLines={1} style={styles.shrinkableFull}>
                {fromMeta.name}
            </Text>
        </Animated.View>
    );
};

export const AmountHeaderSubtitle = ({ view }: { view: AmountView }) => {
    const recipientAlias = view.recipientMeta?.meta.name;

    return (
        <Animated.View
            entering={FadeIn.duration(FADE_DURATION_MS)}
            exiting={FadeOut.duration(FADE_DURATION_MS)}
            style={styles.row}
        >
            <Text variant="bodyM" color="secondary" numberOfLines={1} style={styles.shrinkableHalf}>
                {view.fromMeta.name}
            </Text>
            <Text variant="bodyM" color="tertiary">
                →
            </Text>
            {recipientAlias && (
                <Text
                    variant="bodyM"
                    color="secondary"
                    numberOfLines={1}
                    style={styles.shrinkableHalf}
                >
                    {recipientAlias}
                </Text>
            )}
            <Text variant="bodyM" color="tertiary">
                {ellipsisMiddle(view.parsed.recipient.address)}
            </Text>
        </Animated.View>
    );
};
