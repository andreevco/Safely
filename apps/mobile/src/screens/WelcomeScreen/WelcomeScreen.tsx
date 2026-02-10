import { Trans, useTranslation } from 'react-i18next';
import { Alert, Linking, View } from 'react-native';

import { useOnboardingFlow } from '@mobile/features/onboarding';
import { Button, Screen, Text } from '@mobile/shared/ui';

import { styles } from './WelcomeScreen.styles';

const TERMS_URL = 'https://google.com';
const PRIVACY_URL = 'https://google.com';

export const WelcomeScreen = () => {
    const { t } = useTranslation();
    const { onStartCreate } = useOnboardingFlow();

    const handleSignIn = () => {
        Alert.alert('Not implemented yet');
    };

    return (
        <Screen>
            <Screen.Content>
                <View style={styles.textContainer}>
                    <Text variant="titleM">{t('welcome.title')}</Text>
                    <Text variant="bodyL" color="secondary" textAlign="center">
                        {t('welcome.subtitle')}
                    </Text>
                </View>

                <View style={styles.buttonsContainer}>
                    <Button type="primary" size="large" onPress={onStartCreate}>
                        {t('welcome.createNew')}
                    </Button>
                    <Button type="secondary" size="large" onPress={handleSignIn}>
                        {t('welcome.importExisting')}
                    </Button>
                </View>

                <Text style={styles.legalText} variant="bodyS" color="tertiary" textAlign="center">
                    <Trans
                        i18nKey="welcome.legal"
                        components={{
                            terms: (
                                <Text
                                    variant="bodyS"
                                    color="link"
                                    onPress={() => Linking.openURL(TERMS_URL)}
                                />
                            ),
                            privacy: (
                                <Text
                                    variant="bodyS"
                                    color="link"
                                    onPress={() => Linking.openURL(PRIVACY_URL)}
                                />
                            )
                        }}
                    />
                </Text>
            </Screen.Content>
        </Screen>
    );
};
