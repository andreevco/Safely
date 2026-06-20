import { useNavigation } from '@react-navigation/core';
import { CommonActions } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { State } from 'react-native-ble-plx';

import {
    getBluetoothState,
    isLedgerSessionConnected,
    useLedgerSession
} from '@mobile/features/ledger';
import { resources } from '@mobile/shared/resources';
import { Button, Image, Screen, StepsList, Text } from '@mobile/shared/ui';

import { styles } from './ConnectLedgerScreen.styles';

export const ConnectLedgerScreen = () => {
    const { t } = useTranslation();
    const navigation = useNavigation();
    const { getLedgerKit, sessionId, setSessionId } = useLedgerSession();

    const steps = [
        {
            title: t('addWallet.connectLedger.screen.steps.bluetooth.title'),
            description: t('addWallet.connectLedger.screen.steps.bluetooth.description')
        },
        {
            title: t('addWallet.connectLedger.screen.steps.unlock.title'),
            description: t('addWallet.connectLedger.screen.steps.unlock.description')
        },
        {
            title: t('addWallet.connectLedger.screen.steps.import.title'),
            description: t('addWallet.connectLedger.screen.steps.import.description')
        }
    ];

    const handleContinue = async () => {
        const state = await getBluetoothState();

        if (state !== State.PoweredOn) {
            navigation.dispatch(CommonActions.navigate('BluetoothAccessRequiredModal'));

            return;
        }

        const canReuse = sessionId
            ? await isLedgerSessionConnected(getLedgerKit(), sessionId)
            : false;

        if (canReuse) {
            navigation.dispatch(
                CommonActions.navigate('LedgerFlowModal', { screen: 'LedgerPairingModal' })
            );

            return;
        }

        setSessionId(null);
        navigation.dispatch(
            CommonActions.navigate('LedgerFlowModal', { screen: 'LedgerDiscoveryModal' })
        );
    };

    return (
        <Screen>
            <Screen.Header>
                <Screen.Header.BackButton />
            </Screen.Header>
            <Screen.Content>
                <View style={styles.content}>
                    <Image source={resources.ledgerPreview} style={styles.image} />
                    <View style={styles.textContainer}>
                        <Text textAlign="center" variant="titleM">
                            {t('addWallet.connectLedger.screen.title')}
                        </Text>
                        <Text textAlign="center" variant="bodyL" color="secondary">
                            {t('addWallet.connectLedger.screen.subtitle')}
                        </Text>
                    </View>
                    <StepsList steps={steps} />
                </View>
                <View style={styles.buttonContainer}>
                    <Button type="primary" size="large" onPress={handleContinue}>
                        {t('common.continue')}
                    </Button>
                </View>
            </Screen.Content>
        </Screen>
    );
};
