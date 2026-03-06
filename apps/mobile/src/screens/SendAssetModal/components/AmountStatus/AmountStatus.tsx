import { useTranslation } from 'react-i18next';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Text } from '@mobile/shared/ui/Text';

interface AmountStatusProps {
    isMax: boolean;
    hasInsufficientBalance?: boolean;
    remainingBalance?: string;
}

export const AmountStatus = (props: AmountStatusProps) => {
    const { isMax, hasInsufficientBalance, remainingBalance } = props;

    const { t } = useTranslation();

    if (isMax) {
        return (
            <Animated.View entering={FadeIn.duration(100)} exiting={FadeOut.duration(100)}>
                <Text variant="bodyM" color="secondary" monospace>
                    {t('send.maxHint')}
                </Text>
            </Animated.View>
        );
    }

    if (hasInsufficientBalance) {
        return (
            <Text variant="bodyM" color="accentRed">
                {t('send.insufficientBalance')}
            </Text>
        );
    }

    return (
        <Text variant="bodyM" color="tertiary" monospace>
            {remainingBalance
                ? t('send.remaining', {
                      amount: remainingBalance,
                      symbol: ''
                  })
                : ' '}
        </Text>
    );
};
