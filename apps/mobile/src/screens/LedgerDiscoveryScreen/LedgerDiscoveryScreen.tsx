import { useNavigation } from '@react-navigation/core';
import { CommonActions } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { getSignalLevel, useLedgerDeviceScan, useLedgerSession } from '@mobile/features/ledger';
import {
    Button,
    Cell,
    CircularSpinner,
    Icon,
    List,
    Lock56,
    Screen,
    SignalHigh16,
    SignalLow16,
    SignalMedium16,
    Text
} from '@mobile/shared/ui';

import { styles } from './LedgerDiscoveryScreen.styles';

const SIGNAL_ICON = {
    weak: SignalLow16,
    medium: SignalMedium16,
    strong: SignalHigh16
} as const;

export const LedgerDiscoveryScreen = () => {
    const { t } = useTranslation();
    const navigation = useNavigation();
    const { devices, status } = useLedgerDeviceScan();
    const { selectedDevice, setSelectedDevice } = useLedgerSession();

    const handleContinue = () => {
        if (!selectedDevice) {
            return;
        }

        navigation.dispatch(
            CommonActions.navigate('LedgerPairingModal', { device: selectedDevice.name })
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
                                {devices.map(device => (
                                    <Cell key={device.id} onPress={() => setSelectedDevice(device)}>
                                        <Cell.Image
                                            type="icon"
                                            style={styles.signalIcon}
                                            icon={SIGNAL_ICON[getSignalLevel(device.rssi)]}
                                        />
                                        <Cell.Content>
                                            <Cell.Row>
                                                <Cell.Title>{device.name}</Cell.Title>
                                            </Cell.Row>
                                        </Cell.Content>
                                        {selectedDevice?.id === device.id && <Cell.Checkmark />}
                                    </Cell>
                                ))}
                            </List.Group>
                        </List>
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
