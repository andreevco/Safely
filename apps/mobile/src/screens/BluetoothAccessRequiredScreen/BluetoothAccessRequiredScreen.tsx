import { useNavigation } from '@react-navigation/core';
import { StackActions, useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, View } from 'react-native';
import { State } from 'react-native-ble-plx';

import { getBluetoothState } from '@mobile/features/ledger';
import { BluetoothRequired96, Button, Icon, Screen, Text, Xmark16 } from '@mobile/shared/ui';
import { Button as HeaderButton } from '@mobile/shared/ui/Screen/components/Header/components/Button';

import { styles } from './BluetoothAccessRequiredScreen.styles';

export const BluetoothAccessRequiredScreen = () => {
    const { t } = useTranslation();
    const navigation = useNavigation();

    useFocusEffect(
        useCallback(() => {
            let isActive = true;

            getBluetoothState().then(state => {
                if (isActive && state === State.PoweredOn) {
                    navigation.dispatch(StackActions.replace('LedgerFlowModal'));
                }
            });

            return () => {
                isActive = false;
            };
        }, [navigation])
    );

    const handleCancel = useCallback(() => {
        navigation.dispatch(StackActions.popToTop());
    }, [navigation]);

    const handleOpenSettings = useCallback(() => {
        void Linking.openSettings();
    }, []);

    return (
        <Screen>
            <Screen.Header variant="left">
                <View />
                <HeaderButton onPress={handleCancel}>
                    <Icon icon={Xmark16} />
                </HeaderButton>
            </Screen.Header>
            <View style={styles.content}>
                <Icon icon={BluetoothRequired96} />
                <View style={styles.textContainer}>
                    <Text textAlign="center" variant="titleM">
                        {t('addWallet.connectLedger.bluetoothAccess.title')}
                    </Text>
                    <Text textAlign="center" variant="bodyL" color="secondary">
                        {t('addWallet.connectLedger.bluetoothAccess.description')}
                    </Text>
                </View>
            </View>
            <View style={styles.buttonContainer}>
                <Button type="primary" size="large" onPress={handleOpenSettings}>
                    {t('addWallet.connectLedger.bluetoothAccess.button')}
                </Button>
            </View>
        </Screen>
    );
};
