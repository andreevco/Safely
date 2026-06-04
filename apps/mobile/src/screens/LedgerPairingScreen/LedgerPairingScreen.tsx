import { useNavigation, useRoute } from '@react-navigation/core';
import { StackActions } from '@react-navigation/native';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useLedgerPairing } from '@mobile/features/ledger';
import { CircularSpinner, Icon, Lock56, Screen, Text } from '@mobile/shared/ui';

import { styles } from './LedgerPairingScreen.styles';

export const LedgerPairingScreen = () => {
    const { t } = useTranslation();
    const navigation = useNavigation();
    const route = useRoute();
    const device = (route.params as { device?: string })?.device ?? 'Ledger';
    const { status } = useLedgerPairing();

    useEffect(() => {
        if (status === 'connected') {
            navigation.dispatch(StackActions.replace('LedgerPairingSuccessModal'));
        }

        if (status === 'error') {
            navigation.goBack();
        }
    }, [status, navigation]);

    return (
        <Screen>
            <Screen.Header variant="left">
                <Screen.Header.BackButton />
            </Screen.Header>
            <View style={styles.content}>
                <Icon icon={Lock56} />
                <View style={styles.textContainer}>
                    <Text textAlign="center" variant="titleM">
                        {t('addWallet.connectLedger.pairing.title', { device })}
                    </Text>
                    <Text textAlign="center" variant="bodyL" color="secondary">
                        {t('addWallet.connectLedger.pairing.subtitle')}
                    </Text>
                </View>
                <CircularSpinner />
            </View>
        </Screen>
    );
};
