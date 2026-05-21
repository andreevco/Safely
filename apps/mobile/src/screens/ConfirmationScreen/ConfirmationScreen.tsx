import type { StaticScreenProps } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { notificationAsync, NotificationFeedbackType } from 'expo-haptics';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import type { SendFormResult } from '@safely/ux';
import {
    useActiveBtcWallet,
    useActivePortfolio,
    useEstimateAssetTransfer,
    useLogger,
    useNumberFormatter,
    useSendAssetTransfer
} from '@safely/ux';

import { TransactionFee } from '@mobile/screens/ConfirmationScreen/components/TransactionFee';
import { TransactionSendResult } from '@mobile/screens/ConfirmationScreen/components/TransactionSendResult';
import { Checkmark96, Icon, List, Screen, Text, Image } from '@mobile/shared/ui';

import { Amount, ConfirmationFooter, Wallet, TransactionCell } from './components';
import { styles } from './ConfirmationScreen.styles';
import type { ConfirmationState } from './ConfirmationScreen.types';

export type SendConfirmationParams = {
    confirmationResult: SendFormResult;
    onSuccess?: () => void;
};

export type ConfirmationScreenProps = StaticScreenProps<SendConfirmationParams>;

export const ConfirmationScreen = (props: ConfirmationScreenProps) => {
    const { route } = props;
    const { confirmationResult, onSuccess } = route.params;

    const { t } = useTranslation();
    const navigation = useNavigation();
    const btcWallet = useActiveBtcWallet();
    const activePortfolio = useActivePortfolio();
    const logger = useLogger();

    const [confirmationState, setConfirmationState] = useState<ConfirmationState>({ type: 'idle' });

    const { data: txTemplate, error: txTemplateError } = useEstimateAssetTransfer(
        confirmationResult,
        {
            enabled: confirmationState.type !== 'success'
        }
    );
    const { mutateAsync: send, data: sendResult } = useSendAssetTransfer(txTemplate);
    const formatter = useNumberFormatter();

    const onSend = useCallback(async () => {
        try {
            setConfirmationState({ type: 'sending' });
            await send();
            onSuccess?.();
            notificationAsync(NotificationFeedbackType.Success);
            setConfirmationState({ type: 'success' });
        } catch (error) {
            logger.error('[ConfirmationScreen] send failed', error);
            notificationAsync(NotificationFeedbackType.Error);
            setConfirmationState({ type: 'error', error });
        }
    }, [send, onSuccess, logger]);

    const displayState = useMemo(() => {
        if (txTemplateError) {
            return { type: 'estimateError' as const, error: txTemplateError };
        }

        return confirmationState;
    }, [confirmationState, txTemplateError]);

    const onGoBack = useCallback(() => {
        navigation.getParent()?.goBack();
    }, [navigation]);

    const asset = confirmationResult.amount.cryptoAssetAmount.asset;

    const TitleComponent = useMemo(() => {
        switch (confirmationState.type) {
            case 'idle':
            case 'sending':
            case 'error':
            case 'estimateError':
                return (
                    <Animated.View
                        key={confirmationState.type}
                        exiting={FadeOut.duration(150)}
                        style={styles.titleWithLogoContainer}
                    >
                        <View style={styles.assetLogoContainer}>
                            {asset.image && <Image source={asset.image} style={styles.assetLogo} />}
                        </View>
                        <Text style={styles.title} variant="titleM">
                            {t('confirmation.title', {
                                symbol: asset.symbol
                            })}
                        </Text>
                    </Animated.View>
                );
            case 'success':
                return (
                    <Animated.View
                        key={confirmationState.type}
                        entering={FadeIn.duration(150).delay(150)}
                        exiting={FadeOut.duration(150)}
                        style={styles.titleWithLogoContainer}
                    >
                        <Icon icon={Checkmark96} color="accentGreen" />
                        <Text style={styles.title} variant="titleM">
                            {t('confirmation.success')}
                        </Text>
                    </Animated.View>
                );
            default:
                return null;
        }
    }, [confirmationState.type, asset, t]);

    return (
        <Screen>
            <Screen.Header>
                {confirmationState.type !== 'success' && <Screen.Header.BackButton />}
                <Screen.Header.Title />
            </Screen.Header>
            <View style={styles.container}>
                {TitleComponent}
                <List style={styles.list}>
                    <List.Group style={styles.listGroup}>
                        <TransactionCell
                            title={t('confirmation.from')}
                            value={
                                <Wallet
                                    address={btcWallet.address}
                                    meta={{ kind: 'portfolio', meta: activePortfolio.meta }}
                                />
                            }
                        />
                        <TransactionCell
                            title={t('confirmation.to')}
                            value={
                                <Wallet
                                    address={confirmationResult.recipient.address}
                                    meta={confirmationResult.recipientMeta}
                                />
                            }
                        />
                    </List.Group>
                    <List.Group style={styles.listGroup}>
                        <Amount
                            fiatAmount={confirmationResult.amount.fiatAssetAmount.format(formatter)}
                            cryptoAmount={confirmationResult.amount.cryptoAssetAmount.format(
                                formatter,
                                { fullPrecision: true }
                            )}
                            inputType={confirmationResult.amount.inputType}
                        />
                        <TransactionFee estimation={txTemplate?.estimation} />
                    </List.Group>
                    {!!sendResult && (
                        <List.Group style={styles.listGroup}>
                            <TransactionSendResult sendResult={sendResult} />
                        </List.Group>
                    )}
                </List>
                <ConfirmationFooter
                    onSend={onSend}
                    onGoBack={onGoBack}
                    state={displayState}
                    isEstimating={!txTemplate}
                />
            </View>
        </Screen>
    );
};
