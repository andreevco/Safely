import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useRef, useCallback, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import PagerView from 'react-native-pager-view';

import {
    useSendForm,
    SendFormResult,
    SendFormError,
    useNumberFormatter,
    useAppSdk,
    useActiveFiat
} from '@safely/ux';

import { SendConfirmationParams } from '@mobile/screens/ConfirmationScreen';
import { Button, Screen } from '@mobile/shared/ui';
import { ArrowLeft16, Icon } from '@mobile/shared/ui/Icon';

import { styles } from './SendAssetModal.styles';
import { AmountStep, RecipientStep } from './steps';

type SendStackParamList = {
    SendAssetModal: undefined;
    ConfirmationModal: SendConfirmationParams;
};

export const SendAssetModal = () => {
    const { t } = useTranslation();
    const navigation = useNavigation<NavigationProp<SendStackParamList>>();
    const pagerRef = useRef<PagerView>(null);
    const formatter = useNumberFormatter();
    const { numberFormatLocale } = useAppSdk();
    const activeFiat = useActiveFiat();

    const handleSubmit = useCallback(
        (result: SendFormResult) => {
            const { amount, recipient } = result;
            const cryptoAmount = amount.cryptoAssetAmount;
            const fiatAmount = amount.fiatAssetAmount;
            const symbol = cryptoAmount.asset.symbol;

            // TODO Temp mock
            navigation.navigate('ConfirmationModal', {
                recipientAddress: recipient.address,
                cryptoAmount: cryptoAmount.format(formatter),
                fiatAmount: fiatAmount ? fiatAmount.format(formatter) : '',
                assetSymbol: symbol,
                networkFee: '0.00001 BTC',
                networkFeeFiat: '$0.98'
            });
        },
        [navigation, formatter]
    );

    const { state, actions, step, meta } = useSendForm({
        onSubmit: handleSubmit,
        shouldResetForm: false
    });

    const amountInputType = state.values.amountInputType;
    const asset = state.parsed.asset;
    const hasPrice = !!asset?.price;

    const handleSwitchFiatMode = useCallback(() => {
        const newType = amountInputType === 'fiat' ? 'crypto' : 'fiat';
        actions.setAmountInputType(newType);
    }, [amountInputType, actions]);

    const mask = useMemo(() => {
        const decimals = asset?.amount.asset.decimals ?? 8;
        const decimalsMask = '9'.repeat(decimals);
        return `[09999999999999999999999]${numberFormatLocale.decimalSeparator}[${decimalsMask}]`;
    }, [asset, numberFormatLocale.decimalSeparator]);

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
    }, [step.index]);

    return (
        <Screen>
            <Screen.Header>
                {isFirstStep ? (
                    <Screen.Header.CloseButton />
                ) : (
                    <Screen.Header.Button onPress={step.prev}>
                        <Icon icon={ArrowLeft16} />
                    </Screen.Header.Button>
                )}
                <Screen.Header.Title>{t('send.title')}</Screen.Header.Title>
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
                    key="recipient"
                    value={state.values.recipient}
                    error={state.errors.recipient}
                    onChangeText={actions.setRecipient}
                />
                <AmountStep
                    key="amount"
                    mask={mask}
                    value={state.values.amount}
                    onChangeText={actions.setAmount}
                    isMax={state.parsed.isMax}
                    onMaxPress={() => actions.setIsMax(true)}
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
