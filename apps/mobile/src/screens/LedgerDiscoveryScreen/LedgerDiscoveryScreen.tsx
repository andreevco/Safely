import { useNavigation } from '@react-navigation/core';
import { CommonActions } from '@react-navigation/native';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useLedgerDeviceScan, useLedgerSession } from '@mobile/features/ledger';
import { Screen, Text } from '@mobile/shared/ui';

import { BluetoothPulse } from './components/BluetoothPulse';
import { styles } from './LedgerDiscoveryScreen.styles';

export const LedgerDiscoveryScreen = () => {
    const { t } = useTranslation();
    const navigation = useNavigation();
    const { devices } = useLedgerDeviceScan();
    const { setSelectedDevice } = useLedgerSession();
    const hasNavigated = useRef(false);

    const device = devices[0];

    useEffect(() => {
        if (!device || hasNavigated.current) {
            return;
        }

        hasNavigated.current = true;
        setSelectedDevice(device);
        navigation.dispatch(CommonActions.navigate('LedgerPairingModal', { device: device.name }));
    }, [device, navigation, setSelectedDevice]);

    return (
        <Screen>
            <Screen.Header variant="left">
                <Screen.Header.BackButton />
            </Screen.Header>
            <Screen.Content style={styles.content}>
                <View style={styles.header}>
                    <BluetoothPulse />
                    <View style={styles.textContainer}>
                        <Text textAlign="center" variant="titleM">
                            {t('addWallet.connectLedger.discovery.title')}
                        </Text>
                        <Text textAlign="center" variant="bodyL" color="secondary">
                            {t('addWallet.connectLedger.discovery.subtitle')}
                        </Text>
                    </View>
                </View>
            </Screen.Content>
        </Screen>
    );
};
