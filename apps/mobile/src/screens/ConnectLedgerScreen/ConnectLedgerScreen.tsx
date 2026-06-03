import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, Icon, Lock56, Screen, StepsList, Text } from '@mobile/shared/ui';

import { styles } from './ConnectLedgerScreen.styles';

export const ConnectLedgerScreen = () => {
    const { t } = useTranslation();

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

    const handleContinue = () => {};

    return (
        <Screen>
            <Screen.Header>
                <Screen.Header.BackButton />
            </Screen.Header>
            <Screen.Content>
                <View style={styles.content}>
                    <Icon icon={Lock56} />
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
