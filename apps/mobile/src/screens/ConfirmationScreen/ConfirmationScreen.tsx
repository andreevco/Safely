import { StaticScreenProps, useNavigation } from '@react-navigation/native';
import { notificationAsync, NotificationFeedbackType } from 'expo-haptics';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { ellipsisMiddle } from '@safely/core';
import {
    SendFormResult,
    useActiveBtcWallet,
    useEstimateAssetTransfer,
    useNumberFormatter,
    useSendAssetTransfer
} from '@safely/ux';

import { TransactionFee } from '@mobile/screens/ConfirmationScreen/components/TransactionFee';
import { Checkmark96, Icon, List, Screen, Text, Image } from '@mobile/shared/ui';

import { Amount, ConfirmationFooter, TransactionCell } from './components';
import { styles } from './ConfirmationScreen.styles';
import { ConfirmationState } from './ConfirmationScreen.types';

export type SendConfirmationParams = {
    confirmationResult: SendFormResult;
};

export type ConfirmationScreenProps = StaticScreenProps<SendConfirmationParams>;

export const ConfirmationScreen = (props: ConfirmationScreenProps) => {
    const { route } = props;
    const { confirmationResult } = route.params;
    const navigation = useNavigation();
    const { t } = useTranslation();
    const btcWallet = useActiveBtcWallet();

    const [confirmationState, setConfirmationState] = useState<ConfirmationState>(
        ConfirmationState.SIGNING
    );

    const { data: txTemplate } = useEstimateAssetTransfer(confirmationResult);
    const { mutateAsync: send } = useSendAssetTransfer(txTemplate);
    const formatter = useNumberFormatter();

    const onSend = useCallback(async () => {
        try {
            setConfirmationState(ConfirmationState.SENDING);
            await send();
            notificationAsync(NotificationFeedbackType.Success);
            setConfirmationState(ConfirmationState.SUCCESS);
        } catch {
            notificationAsync(NotificationFeedbackType.Error);
            setConfirmationState(ConfirmationState.ERROR);
            setTimeout(() => {
                setConfirmationState(ConfirmationState.SIGNING);
            }, 1000);
        }
    }, [send]);

    const onGoBack = useCallback(() => {
        navigation.getParent()?.goBack();
    }, [navigation]);

    const asset = confirmationResult.amount.cryptoAssetAmount.asset;

    const TitleComponent = useMemo(() => {
        switch (confirmationState) {
            case ConfirmationState.SIGNING:
            case ConfirmationState.SENDING:
            case ConfirmationState.ERROR:
                return (
                    <Animated.View
                        key={confirmationState}
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
            case ConfirmationState.SUCCESS:
                return (
                    <Animated.View
                        key={confirmationState}
                        entering={FadeIn.duration(150).delay(150)}
                        exiting={FadeOut.duration(150)}
                        style={styles.titleWithLogoContainer}
                    >
                        <View style={styles.assetLogoContainer}>
                            <Icon icon={Checkmark96} color="accentGreen" />
                        </View>
                        <Text style={styles.title} variant="titleM">
                            {t('confirmation.success')}
                        </Text>
                    </Animated.View>
                );
            default:
                return null;
        }
    }, [confirmationState, asset, t]);

    return (
        <Screen background="constantBlack">
            <Screen.Header>
                {confirmationState !== ConfirmationState.SUCCESS && <Screen.Header.BackButton />}
                <Screen.Header.Title />
            </Screen.Header>
            <View style={styles.container}>
                {TitleComponent}
                <List style={styles.list}>
                    <List.Group style={styles.listGroup}>
                        <TransactionCell
                            title={t('confirmation.from')}
                            value={ellipsisMiddle(btcWallet.address)}
                        />
                        <TransactionCell
                            title={t('confirmation.to')}
                            value={ellipsisMiddle(
                                confirmationResult.recipient.getDisplayData().address
                            )}
                        />
                    </List.Group>
                    <List.Group style={styles.listGroup}>
                        <Amount
                            fiatAmount={confirmationResult.amount.fiatAssetAmount?.format(
                                formatter
                            )}
                            cryptoAmount={confirmationResult.amount.cryptoAssetAmount?.format(
                                formatter
                            )}
                        />
                        {txTemplate && <TransactionFee fee={txTemplate.estimation.fee} />}
                    </List.Group>
                </List>
                <ConfirmationFooter onSend={onSend} onGoBack={onGoBack} state={confirmationState} />
            </View>
        </Screen>
    );
};
