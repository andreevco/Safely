import { useNavigation } from '@react-navigation/core';
import { StackActions } from '@react-navigation/native';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Checkmark96, Icon, Screen, Text } from '@mobile/shared/ui';

import { styles } from './LedgerPairingSuccessScreen.styles';

export const LedgerPairingSuccessScreen = () => {
    const { t } = useTranslation();
    const navigation = useNavigation();

    useEffect(() => {
        const timer = setTimeout(() => {
            navigation.dispatch(StackActions.replace('LedgerImportAccountsModal'));
        }, 2000);

        return () => clearTimeout(timer);
    }, [navigation]);

    return (
        <Screen>
            <View style={styles.content}>
                <Icon icon={Checkmark96} />
                <View style={styles.textContainer}>
                    <Text textAlign="center" variant="titleM">
                        {t('addWallet.connectLedger.pairingSuccess.title')}
                    </Text>
                    <Text textAlign="center" variant="bodyL" color="secondary">
                        {t('addWallet.connectLedger.pairingSuccess.subtitle')}
                    </Text>
                </View>
            </View>
        </Screen>
    );
};
