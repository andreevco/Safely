import { Trans, useTranslation } from 'react-i18next';
import { Alert, ImageBackground, Linking, View } from 'react-native';

import { useOnboardingFlow } from '@mobile/features/onboarding';
import { resources } from '@mobile/shared/resources';
import { Button, Icon, Safely96, Screen, Text } from '@mobile/shared/ui';

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
        <Screen background="transparent">
            <ImageBackground source={resources.welcomeScreenBg} style={styles.background}>
                <Screen.Content>
                    <Icon icon={Safely96} style={styles.logo} />

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

                    <View style={styles.legalContainer}>
                        <Text variant="bodyS" color="tertiary" textAlign="center">
                            {t('welcome.legalLine1')}
                        </Text>
                        <Text variant="bodyS" color="tertiary" textAlign="center">
                            <Trans
                                i18nKey="welcome.legalLine2"
                                components={{
                                    terms: (
                                        <Text
                                            variant="bodyS"
                                            color="secondary"
                                            onPress={() => Linking.openURL(TERMS_URL)}
                                        />
                                    ),
                                    privacy: (
                                        <Text
                                            variant="bodyS"
                                            color="secondary"
                                            onPress={() => Linking.openURL(PRIVACY_URL)}
                                        />
                                    )
                                }}
                            />
                        </Text>
                    </View>
                </Screen.Content>
            </ImageBackground>
        </Screen>
    );
};
