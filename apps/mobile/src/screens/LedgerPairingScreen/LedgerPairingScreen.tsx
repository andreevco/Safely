import { View } from 'react-native';

import { LedgerSteps, useExitToConnectLedger } from '@mobile/features/ledger';
import { ArrowLeft16, Icon, Screen, Image, Text } from '@mobile/shared/ui';

import { styles } from './LedgerPairingScreen.styles';
import { useLedgerPairingScreen } from './useLedgerPairingScreen';

export const LedgerPairingScreen = () => {
    const { image, title, subtitle, steps } = useLedgerPairingScreen();
    const exitToConnect = useExitToConnectLedger();

    return (
        <Screen>
            <Screen.Header variant="left">
                <Screen.Header.Button onPress={exitToConnect}>
                    <Icon icon={ArrowLeft16} />
                </Screen.Header.Button>
            </Screen.Header>
            <Screen.Content>
                <View style={styles.content}>
                    <Image source={image} style={styles.image} />
                    <View style={styles.textContainer}>
                        <Text textAlign="center" variant="titleM">
                            {title}
                        </Text>
                        <Text textAlign="center" variant="bodyL" color="secondary">
                            {subtitle}
                        </Text>
                    </View>
                    <LedgerSteps steps={steps} />
                </View>
            </Screen.Content>
        </Screen>
    );
};
