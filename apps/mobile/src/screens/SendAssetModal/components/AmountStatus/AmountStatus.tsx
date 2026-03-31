import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { RootStackNavigationProp } from '@mobile/app/navigation/types';
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
    const navigation = useNavigation<RootStackNavigationProp>();

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

    const content = (
        <>
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
        </>
    );

    if (pendingBalance) {
        return (
            <Pressable onPress={() => navigation.navigate('PendingFundsSheet')}>
                {content}
            </Pressable>
        );
    } else {
        return <View>{content}</View>;
    }
};
