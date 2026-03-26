import { useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useEraseAllData } from '@safely/ux';

import { RootStackNavigationProp } from '@mobile/app/navigation/types';
import { useOnboardingFlow } from '@mobile/features/onboarding';
import { Button, Checkmark96, Icon, Screen, Text } from '@mobile/shared/ui';

import { styles } from './SignInSuccessScreen.styles';

export const SignInSuccessScreen = () => {
    const { t } = useTranslation();
    const { mutateAsync: eraseAllData } = useEraseAllData();
    const { onStartSignIn: onContinue } = useOnboardingFlow();
    const navigation = useNavigation<RootStackNavigationProp>();

    const handleSignOut = useCallback(async () => {
        await eraseAllData();
        navigation.reset({
            index: 0,
            routes: [{ name: 'WelcomeScreen' }]
        });
    }, [eraseAllData, navigation]);

    return (
        <Screen>
            <Screen.Header variant="left">
                <Screen.Header.Title />
                <Screen.Header.Button type="small" onPress={handleSignOut}>
                    <Text variant="labelM" color="primary">
                        {t('passcode.lockout.signOut')}
                    </Text>
                </Screen.Header.Button>
            </Screen.Header>
            <Screen.Content>
                <View style={styles.content}>
                    <Icon icon={Checkmark96} />
                    <View style={styles.textContainer}>
                        <Text textAlign="center" variant="titleM">
                            {t('signIn.success.title')}
                        </Text>
                        <Text textAlign="center" variant="bodyL" color="secondary">
                            {t('signIn.success.subtitle')}
                        </Text>
                    </View>
                </View>
                <View style={styles.buttonContainer}>
                    <Button type="primary" size="large" onPress={onContinue}>
                        {t('signIn.success.continue')}
                    </Button>
                </View>
            </Screen.Content>
        </Screen>
    );
};
