import { useNavigation, useRoute } from '@react-navigation/core';
import { StackActions } from '@react-navigation/native';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { LedgerStatusScreen, useLedgerPairing } from '@mobile/features/ledger';
import { CircularSpinner } from '@mobile/shared/ui';

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
        <LedgerStatusScreen
            hasBackButton
            media={
                <View style={styles.spinnerBackground}>
                    <CircularSpinner />
                </View>
            }
            title={t('addWallet.connectLedger.pairing.title', { device })}
            subtitle={t('addWallet.connectLedger.pairing.subtitle')}
            buttonLabel={t('common.continue')}
            isButtonDisabled
        />
    );
};
