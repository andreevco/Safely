import { Ref, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard, TouchableOpacity, View } from 'react-native';
import { MaskedTextInputRef } from 'react-native-advanced-input-mask';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Text } from '@mobile/shared/ui/Text';

import { AmountInput, AmountStatus, AssetSelector } from '../components';
import { styles } from './AmountStep.styles';

interface AmountStepProps {
    value: string;
    onChangeText: (value: string) => void;
    isMax: boolean;
    onMaxPress: () => void;
    onMaxReset: () => void;
    isMaxAvailable?: boolean;
    remainingBalance?: string;
    pendingBalance?: string;
    hasInsufficientBalance?: boolean;
    formattedAlternativeAmount?: string;
    onSwitchFiatMode?: () => void;
    currencySymbol?: string;
    mask: string;
    inputRef?: Ref<MaskedTextInputRef>;
}

export const AmountStep = (props: AmountStepProps) => {
    const {
        value,
        onChangeText,
        isMax,
        onMaxPress,
        onMaxReset,
        isMaxAvailable = true,
        remainingBalance,
        pendingBalance,
        hasInsufficientBalance,
        formattedAlternativeAmount,
        onSwitchFiatMode,
        currencySymbol,
        mask,
        inputRef
    } = props;

    const { t } = useTranslation();

    const handleMaxPress = useCallback(() => {
        Keyboard.dismiss();
        onMaxPress();
    }, [onMaxPress]);

    const handleFocus = useCallback(() => {
        if (isMax) {
            onMaxReset();
        }
    }, [isMax, onMaxReset]);

    return (
        <View style={styles.container}>
            <AmountInput
                ref={inputRef}
                mask={mask}
                value={value}
                onChangeText={onChangeText}
                onFocus={handleFocus}
                placeholder="0"
                isMax={isMax}
                label={t('send.amount')}
                errored={hasInsufficientBalance}
                formattedAlternativeAmount={formattedAlternativeAmount}
                onSwitchFiatMode={onSwitchFiatMode}
                currencySymbol={currencySymbol}
                RightComponent={<AssetSelector />}
            />
            <View style={styles.remainingContainer}>
                <AmountStatus
                    isMax={isMax}
                    hasInsufficientBalance={hasInsufficientBalance}
                    remainingBalance={remainingBalance}
                    pendingBalance={pendingBalance}
                />
                {!isMax && isMaxAvailable && (
                    <Animated.View entering={FadeIn.duration(100)} exiting={FadeOut.duration(100)}>
                        <TouchableOpacity onPress={handleMaxPress} hitSlop={12}>
                            <Text variant="bodyM" color="secondary">
                                {t('send.max')}
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>
                )}
            </View>
        </View>
    );
};
