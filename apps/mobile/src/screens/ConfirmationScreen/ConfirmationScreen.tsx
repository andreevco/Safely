import { StaticScreenProps, useNavigation } from '@react-navigation/native';
import { notificationAsync, NotificationFeedbackType } from 'expo-haptics';
import { Image } from 'expo-image';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { ellipsisMiddle } from '@safely/core';
import { useActiveBtcWallet } from '@safely/ux';

import { resources } from '@mobile/shared/resources';
import { Checkmark96, Icon, List, Screen, Text } from '@mobile/shared/ui';

import { Amount, ConfirmationFooter, TransactionCell } from './components';
import { styles } from './ConfirmationScreen.styles';
import { ConfirmationState } from './ConfirmationScreen.types';

export type SendConfirmationParams = {
    recipientAddress: string;
    recipientLabel?: string;
    cryptoAmount: string;
    fiatAmount?: string;
    assetSymbol: string;
    assetImage?: string;
    networkFee?: string;
    networkFeeFiat?: string;
};

export type ConfirmationScreenProps = StaticScreenProps<SendConfirmationParams>;

export const ConfirmationScreen = (props: ConfirmationScreenProps) => {
    const { route } = props;
    const params = route.params;
    const navigation = useNavigation();
    const { t } = useTranslation();
    const btcWallet = useActiveBtcWallet();

    const [confirmationState, setConfirmationState] = useState<ConfirmationState>(
        ConfirmationState.SIGNING
    );

    const onSend = useCallback(async () => {
        try {
            setConfirmationState(ConfirmationState.SENDING);
            await new Promise(resolve => setTimeout(resolve, 1500));
            notificationAsync(NotificationFeedbackType.Success);
            setConfirmationState(ConfirmationState.SUCCESS);
        } catch {
            notificationAsync(NotificationFeedbackType.Error);
            setConfirmationState(ConfirmationState.ERROR);
            setTimeout(() => {
                setConfirmationState(ConfirmationState.SIGNING);
            }, 1000);
        }
    }, []);

    const onGoBack = useCallback(() => {
        navigation.getParent()?.goBack();
    }, [navigation]);

    const assetImage = useMemo(() => {
        if (params.assetSymbol === 'BTC') {
            return resources.btcLogo;
        }

        return params.assetImage ? { uri: params.assetImage } : null;
    }, [params.assetSymbol, params.assetImage]);

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
                            {assetImage && <Image source={assetImage} style={styles.assetLogo} />}
                        </View>
                        <Text style={styles.title} variant="titleM">
                            {t('confirmation.title', { symbol: params.assetSymbol })}
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
    }, [confirmationState, assetImage, params.assetSymbol, t]);

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
                            value={ellipsisMiddle(params.recipientAddress)}
                        />
                    </List.Group>
                    <List.Group style={styles.listGroup}>
                        <Amount fiatAmount={params.fiatAmount} cryptoAmount={params.cryptoAmount} />
                        {params.networkFee && (
                            <TransactionCell
                                title={t('confirmation.networkFee')}
                                value={params.networkFee}
                                subvalue={params.networkFeeFiat}
                            />
                        )}
                    </List.Group>
                </List>
                <ConfirmationFooter onSend={onSend} onGoBack={onGoBack} state={confirmationState} />
            </View>
        </Screen>
    );
};
