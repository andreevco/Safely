import { useNavigation } from '@react-navigation/core';
import type { StaticScreenProps } from '@react-navigation/native';
import { StackActions, useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { State } from 'react-native-ble-plx';

import { useToast } from '@safely/ux';

import { getBluetoothState, useLedgerSession } from '@mobile/features/ledger';
import { BluetoothExclamationmark96, Button, Icon, Screen, Text, Xmark16 } from '@mobile/shared/ui';
import { Button as HeaderButton } from '@mobile/shared/ui/Screen/components/Header/components/Button';

import { styles } from './BluetoothDisabledScreen.styles';

type BluetoothDisabledScreenProps = StaticScreenProps<
    { onReady?: () => void; onCancel?: () => void } | undefined
>;

export const BluetoothDisabledScreen = ({ route }: BluetoothDisabledScreenProps) => {
    const params = route.params;

    const toast = useToast();
    const { t } = useTranslation();
    const navigation = useNavigation();
    const { getBleManager } = useLedgerSession();

    const proceed = useCallback(() => {
        navigation.goBack();
        params?.onReady?.();
    }, [navigation, params]);

    useFocusEffect(
        useCallback(() => {
            const subscription = getBleManager().onStateChange(state => {
                if (state === State.PoweredOn) {
                    proceed();
                } else if (state === State.Unauthorized) {
                    navigation.dispatch(
                        StackActions.replace('BluetoothAccessRequiredModal', params)
                    );
                }
            }, true);

            return () => subscription.remove();
        }, [navigation, params, getBleManager, proceed])
    );

    const handleTryAgain = useCallback(async () => {
        const state = await getBluetoothState(getBleManager());

        if (state === State.PoweredOn) {
            proceed();
        } else {
            toast(t('addWallet.connectLedger.bluetoothDisabled.stillOff'));
        }
    }, [getBleManager, proceed, toast, t]);

    const handleCancel = useCallback(() => {
        navigation.goBack();
        params?.onCancel?.();
    }, [navigation, params]);

    return (
        <Screen>
            <Screen.Header variant="left">
                <View />
                <HeaderButton onPress={handleCancel}>
                    <Icon icon={Xmark16} />
                </HeaderButton>
            </Screen.Header>
            <View style={styles.content}>
                <Icon icon={BluetoothExclamationmark96} />
                <View style={styles.textContainer}>
                    <Text textAlign="center" variant="titleM">
                        {t('addWallet.connectLedger.bluetoothDisabled.title')}
                    </Text>
                    <Text textAlign="center" variant="bodyL" color="secondary">
                        {t('addWallet.connectLedger.bluetoothDisabled.description')}
                    </Text>
                </View>
            </View>
            <View style={styles.buttonContainer}>
                <Button type="secondary" size="large" onPress={handleTryAgain}>
                    {t('addWallet.connectLedger.bluetoothDisabled.button')}
                </Button>
            </View>
        </Screen>
    );
};
