import { RefObject, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { NumberFormatter } from '@safely/core';
import { type AmountView } from '@safely/ux';

import { Text } from '@mobile/shared/ui/Text';

import { MaskedInputRef } from '../../../../modules/safely-masked-input/src';
import { AmountInput, AmountStatus, AssetSelector } from '../components';
import { styles } from './AmountStep.styles';
import { useAmountStepView } from './useAmountStepView';

interface AmountStepProps {
    view: AmountView;
    inputRef?: RefObject<MaskedInputRef | null>;
    decimalSeparator: string;
    fiatSymbol: string;
    formatter: NumberFormatter;
}

export const AmountStep = (props: AmountStepProps) => {
    const { view, inputRef, decimalSeparator, fiatSymbol, formatter } = props;

    const { t } = useTranslation();

    const {
        decimals,
        hasPrice,
        hasInsufficientBalance,
        isMax,
        inputType,
        alternativeAmount,
        remainingBalance
    } = useAmountStepView({ view, formatter, fiatSymbol });

    const handleSwitchFiatMode = useCallback(() => {
        view.setAmountInputType(inputType === 'fiat' ? 'crypto' : 'fiat');
    }, [view, inputType]);

    const enterMax = 'enterMax' in view ? view.enterMax : undefined;
    const handleMaxPress = useCallback(() => {
        if (!enterMax) return;

        inputRef?.current?.blur();
        enterMax();
    }, [inputRef, enterMax]);

    const handleFocus = useCallback(() => {
        if ('exitMax' in view) view.exitMax();
    }, [view]);

    return (
        <View style={styles.container}>
            <AmountInput
                ref={inputRef}
                decimals={decimals}
                decimalSeparator={decimalSeparator}
                value={view.values.amount}
                onChangeText={view.setAmount}
                onFocus={handleFocus}
                placeholder="0"
                isMax={isMax}
                label={t('send.amount')}
                errored={hasInsufficientBalance}
                formattedAlternativeAmount={alternativeAmount}
                onSwitchFiatMode={hasPrice ? handleSwitchFiatMode : undefined}
                currencySymbol={
                    inputType === 'fiat' ? fiatSymbol : view.parsed.asset?.amount.asset.symbol
                }
                RightComponent={
                    view.parsed.asset && <AssetSelector asset={view.parsed.asset.amount.asset} />
                }
            />
            <View style={styles.remainingContainer}>
                <AmountStatus
                    isMax={isMax}
                    hasInsufficientBalance={hasInsufficientBalance}
                    remainingBalance={remainingBalance}
                />
                {enterMax && view.isMaxAvailable && (
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
