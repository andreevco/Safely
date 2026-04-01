import { useNavigation, NavigationProp, StaticScreenProps } from '@react-navigation/native';
import { useRef, useCallback, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TextInput, View } from 'react-native';
import PagerView from 'react-native-pager-view';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { ellipsisMiddle } from '@safely/core';
import {
    useSendForm,
    SendFormResult,
    SendFormError,
    useNumberFormatter,
    useActiveFiat,
    useAppContext
} from '@safely/ux';

import { SendConfirmationParams } from '@mobile/screens/ConfirmationScreen';
import { Button, Screen, Text } from '@mobile/shared/ui';
import { ArrowLeft16, Icon } from '@mobile/shared/ui/Icon';

import { styles } from './SendAssetModal.styles';
import { AmountStep, RecipientStep } from './steps';
import { MaskedInputRef } from '../../../modules/safely-masked-input/src';

type SendStackParamList = {
    SendAssetModal: {
        address?: string;
        amount?: string;
    };
    ConfirmationModal: SendConfirmationParams;
};

type SendAssetModalProps = StaticScreenProps<SendStackParamList['SendAssetModal']>;

export const SendAssetModal = (props: SendAssetModalProps) => {
    const { address, amount } = props.route.params ?? {};
    const { t } = useTranslation();
    const navigation = useNavigation<NavigationProp<SendStackParamList>>();
    const pagerRef = useRef<PagerView>(null);
    const formatter = useNumberFormatter();
    const { numberFormatLocale } = useAppContext();
    const activeFiat = useActiveFiat();
    const handleSubmit = useCallback(
        (confirmationResult: SendFormResult, onSuccess: () => void) => {
            navigation.navigate('ConfirmationModal', {
                confirmationResult,
                onSuccess
            });
        },
        [navigation]
    );

    const recipientInputRef = useRef<TextInput>(null);
    const amountInputRef = useRef<MaskedInputRef>(null);

    const { state, actions, step, meta, suggestionSelection } = useSendForm({
        onSubmit: handleSubmit,
        shouldResetForm: false,
        initialValues: { recipient: address, amount }
    });

    const amountInputType = state.values.amountInputType;
    const asset = state.parsed.asset;
    const hasPrice = !!asset?.price;

    const handleSwitchFiatMode = useCallback(() => {
        const newType = amountInputType === 'fiat' ? 'crypto' : 'fiat';
        actions.setAmountInputType(newType);
    }, [amountInputType, actions]);

    const decimals = asset?.amount.asset.decimals ?? 8;

    const alternativeAmount = useMemo(() => {
        const parsedAmount = state.parsed.amount;
        const cryptoSymbol = asset?.amount.asset.symbol ?? 'BTC';
        const fiatSymbol = activeFiat.id.symbol;

        if (!parsedAmount) {
            return amountInputType === 'crypto' ? `0 ${fiatSymbol}` : `0 ${cryptoSymbol}`;
        }

        if (amountInputType === 'crypto') {
            const fiat = parsedAmount.fiatAssetAmount;
            return fiat ? fiat.format(formatter, { currencyDisplay: 'code' }) : `0 ${fiatSymbol}`;
        } else {
            const crypto = parsedAmount.cryptoAssetAmount;
            return crypto.format(formatter);
        }
    }, [state.parsed.amount, amountInputType, formatter, asset, activeFiat]);

    const remainingBalance = useMemo(() => {
        if (!asset) return '0 BTC';

        const totalBalance = asset.amount;
        const parsedAmount = state.parsed.amount;
        const usedAmount = parsedAmount?.cryptoAssetAmount;

        if (!usedAmount) {
            return totalBalance.format(formatter);
        }

        const remaining = totalBalance.relativeAmount.minus(usedAmount.relativeAmount);
        if (remaining.lt(0)) {
            return totalBalance.amountMul(0).format(formatter);
        }

        return totalBalance
            .amountSub({ relativeAmount: usedAmount.relativeAmount })
            .format(formatter);
    }, [asset, state.parsed.amount, formatter]);

    const hasInsufficientBalance = state.errors.amount === SendFormError.INSUFFICIENT_BALANCE;

    const isFirstStep = step.index === 0;

    useEffect(() => {
        pagerRef.current?.setPage(step.index);

        const timer =
            state.parsed.isMax && step.index === 1
                ? setTimeout(() => amountInputRef.current?.blur(), 250)
                : setTimeout(
                      () => [recipientInputRef, amountInputRef][step.index]?.current?.focus(),
                      250
                  );

        return () => clearTimeout(timer);
    }, [step.index, state.parsed.isMax]);

    return (
        <Screen>
            <Screen.Header variant="left">
                {isFirstStep ? (
                    <Screen.Header.CloseButton />
                ) : (
                    <Screen.Header.Button onPress={step.prev}>
                        <Icon icon={ArrowLeft16} />
                    </Screen.Header.Button>
                )}
                <Screen.Header.Title>
                    <Text variant="titleS" textAlign="center">
                        {t('send.title')}
                    </Text>
                    {state.parsed.recipient && (
                        <Animated.View
                            entering={FadeIn.duration(150)}
                            exiting={FadeOut.duration(150)}
                        >
                            {meta.portfolioMetaByAddress ? (
                                <View style={styles.recipientRow}>
                                    <Text
                                        variant="bodyM"
                                        color="secondary"
                                        numberOfLines={1}
                                        style={styles.recipientName}
                                    >
                                        {meta.portfolioMetaByAddress.name}
                                    </Text>
                                    <Text variant="bodyM" color="tertiary">
                                        {' '}
                                        {ellipsisMiddle(state.parsed.recipient.address)}
                                    </Text>
                                </View>
                            ) : (
                                <Text
                                    textAlign="center"
                                    variant="bodyM"
                                    color="secondary"
                                    numberOfLines={1}
                                >
                                    {ellipsisMiddle(state.parsed.recipient.address)}
                                </Text>
                            )}
                        </Animated.View>
                    )}
                </Screen.Header.Title>
                <View style={styles.nextButton}>
                    <Button
                        size="small"
                        type="primary"
                        disabled={!step.canGoNext}
                        onPress={step.canGoNext ? step.next : undefined}
                    >
                        {t('common.next')}
                    </Button>
                </View>
            </Screen.Header>
            <PagerView
                ref={pagerRef}
                scrollEnabled={false}
                initialPage={step.index}
                style={styles.pagerView}
            >
                <RecipientStep
                    onSubmitEditing={step.canGoNext ? step.next : undefined}
                    key="recipient"
                    inputRef={recipientInputRef}
                    value={state.values.recipient}
                    error={meta.suggestions.length > 0 ? undefined : state.errors.recipient}
                    onChangeText={actions.setRecipient}
                    suggestions={meta.suggestions}
                    restoredSuggestions={meta.restoredSuggestions}
                    selectedAddress={suggestionSelection.selectedAddress}
                    onSelectSuggestion={suggestionSelection.select}
                    onClearSuggestionSelection={suggestionSelection.clear}
                />
                <AmountStep
                    key="amount"
                    inputRef={amountInputRef}
                    decimals={decimals}
                    decimalSeparator={numberFormatLocale.decimalSeparator}
                    value={state.values.amount}
                    onChangeText={actions.setAmount}
                    isMax={state.parsed.isMax}
                    onMaxPress={() => actions.setIsMax(true)}
                    onMaxReset={() => {
                        actions.setIsMax(false);
                        actions.setAmount('');
                    }}
                    isMaxAvailable={meta.isMaxAvailable}
                    formattedAlternativeAmount={alternativeAmount}
                    onSwitchFiatMode={hasPrice ? handleSwitchFiatMode : undefined}
                    currencySymbol={amountInputType === 'fiat' ? activeFiat.id.symbol : undefined}
                    remainingBalance={remainingBalance}
                    hasInsufficientBalance={hasInsufficientBalance}
                />
            </PagerView>
        </Screen>
    );
};
