import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useOnboardingFlow } from '@mobile/features/onboarding';
import { Button, Checkmark96, Icon, Screen, Text } from '@mobile/shared/ui';

import { styles } from './SignInSuccessScreen.styles';

export const SignInSuccessScreen = () => {
    const { t } = useTranslation();
    const { onStartSignIn: onContinue } = useOnboardingFlow();

    return (
        <Screen>
            <Screen.Header />
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
