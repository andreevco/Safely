import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Text } from '@mobile/shared/ui/Text';

import { styles } from './AmountStatus.styles';

interface AmountStatusProps {
    isMax: boolean;
    hasInsufficientBalance?: boolean;
    remainingBalance?: string;
    pendingBalance?: string;
}

export const AmountStatus = (props: AmountStatusProps) => {
    const { isMax, hasInsufficientBalance, remainingBalance, pendingBalance } = props;

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
        <View>
            <View style={styles.row}>
                <Text variant="bodyM" color="tertiary" monospace>
                    {t('send.remaining')}{' '}
                </Text>
                <Text variant="bodyM" color="tertiary" monospace>
                    {remainingBalance ?? ' '}
                </Text>
            </View>
            {pendingBalance && (
                <View style={styles.row}>
                    <Text variant="bodyM" color="tertiary" monospace>
                        {t('send.pending')}{' '}
                    </Text>
                    <Text variant="bodyM" color="tertiary" monospace>
                        {pendingBalance}
                    </Text>
                </View>
            )}
        </View>
    );
};
