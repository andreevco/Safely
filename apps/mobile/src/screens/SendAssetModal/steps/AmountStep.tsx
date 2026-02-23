import { useTranslation } from 'react-i18next';
import { TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Text } from '@mobile/shared/ui/Text';

import { AmountInput, AssetSelector } from '../components';
import { styles } from './AmountStep.styles';

interface AmountStepProps {
    value: string;
    onChangeText: (value: string) => void;
    isMax: boolean;
    onMaxPress: () => void;
    isMaxAvailable?: boolean;
    remainingBalance?: string;
    hasInsufficientBalance?: boolean;
    formattedAlternativeAmount?: string;
    onSwitchFiatMode?: () => void;
    currencySymbol?: string;
    mask: string;
}

export const AmountStep = (props: AmountStepProps) => {
    const {
        value,
        onChangeText,
        isMax,
        onMaxPress,
        isMaxAvailable = true,
        remainingBalance,
        hasInsufficientBalance,
        formattedAlternativeAmount,
        onSwitchFiatMode,
        currencySymbol,
        mask
    } = props;
    const { t } = useTranslation();

    return (
        <View style={styles.container}>
            <AmountInput
                mask={mask}
                value={value}
                onChangeText={onChangeText}
                placeholder="0"
                label={t('send.amount')}
                errored={hasInsufficientBalance}
                formattedAlternativeAmount={formattedAlternativeAmount}
                onSwitchFiatMode={onSwitchFiatMode}
                currencySymbol={currencySymbol}
                RightComponent={<AssetSelector />}
            />
            <View style={styles.remainingContainer}>
                {hasInsufficientBalance ? (
                    <Text variant="bodyM" color="accentRed">
                        {t('send.insufficientBalance')}
                    </Text>
                ) : (
                    <Text variant="bodyM" color="tertiary" monospace>
                        {remainingBalance
                            ? t('send.remaining', { amount: remainingBalance, symbol: '' })
                            : ' '}
                    </Text>
                )}
                {!isMax && isMaxAvailable && (
                    <Animated.View entering={FadeIn.duration(100)} exiting={FadeOut.duration(100)}>
                        <TouchableOpacity onPress={onMaxPress}>
                            <Text variant="bodyM" color="tertiary">
                                {t('send.max')}
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>
                )}
            </View>
        </View>
    );
};
