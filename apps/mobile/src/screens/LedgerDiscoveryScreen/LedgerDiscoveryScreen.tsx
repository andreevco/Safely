import { useNavigation } from '@react-navigation/core';
import { CommonActions } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, Cell, CircularSpinner, Icon, List, Lock56, Screen, Text } from '@mobile/shared/ui';

import { styles } from './LedgerDiscoveryScreen.styles';

type DiscoveryStatus = 'searching' | 'found' | 'notFound';

const MOCK_DEVICES = ['Ledger Stax', 'Ledger Nano X'];

export const LedgerDiscoveryScreen = () => {
    const { t } = useTranslation();
    const navigation = useNavigation();
    const [status, setStatus] = useState<DiscoveryStatus>('searching');
    const [selectedDevice, setSelectedDevice] = useState<string | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => setStatus('found'), 1500);

        return () => clearTimeout(timer);
    }, []);

    const handleContinue = () => {
        if (!selectedDevice) {
            return;
        }

        navigation.dispatch(
            CommonActions.navigate('LedgerPairingModal', { device: selectedDevice })
        );
    };

    return (
        <Screen>
            <Screen.Header variant="left">
                <Screen.Header.BackButton />
            </Screen.Header>
            <Screen.Content>
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Icon icon={Lock56} />
                        <View style={styles.textContainer}>
                            <Text textAlign="center" variant="titleM">
                                {t('addWallet.connectLedger.discovery.title')}
                            </Text>
                            <Text textAlign="center" variant="bodyL" color="secondary">
                                {t('addWallet.connectLedger.discovery.subtitle')}
                            </Text>
                        </View>
                    </View>

                    {status === 'searching' && (
                        <View style={styles.statusContainer}>
                            <CircularSpinner />
                            <Text variant="bodyM" color="secondary">
                                {t('addWallet.connectLedger.discovery.searching')}
                            </Text>
                        </View>
                    )}

                    {status === 'found' && (
                        <List style={styles.list}>
                            <List.Group variant="divided">
                                {MOCK_DEVICES.map(device => (
                                    <Cell key={device} onPress={() => setSelectedDevice(device)}>
                                        <Cell.Content>
                                            <Cell.Row>
                                                <Cell.Title>{device}</Cell.Title>
                                            </Cell.Row>
                                        </Cell.Content>
                                        {selectedDevice === device && <Cell.Checkmark />}
                                    </Cell>
                                ))}
                            </List.Group>
                        </List>
                    )}

                    {status === 'notFound' && (
                        <View style={styles.statusContainer}>
                            <Text variant="bodyM" color="secondary">
                                {t('addWallet.connectLedger.discovery.notFound')}
                            </Text>
                        </View>
                    )}
                </View>

                <View style={styles.buttonContainer}>
                    <Button
                        type="primary"
                        size="large"
                        disabled={!selectedDevice}
                        onPress={handleContinue}
                    >
                        {t('common.continue')}
                    </Button>
                </View>
            </Screen.Content>
        </Screen>
    );
};
