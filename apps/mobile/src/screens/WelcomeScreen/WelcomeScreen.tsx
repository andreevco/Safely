import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import { useCallback } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { ImageBackground, Linking, View } from 'react-native';

import { setActiveConnector, useCreateExistingAccountConnector } from '@safely/ux';

import { RootStackNavigationProp } from '@mobile/app/navigation/types';
import { useOnboardingFlow } from '@mobile/features/onboarding';
import { resources } from '@mobile/shared/resources';
import { Button, Screen, Text } from '@mobile/shared/ui';

import { styles } from './WelcomeScreen.styles';

const TERMS_URL = 'https://google.com';
const PRIVACY_URL = 'https://google.com';

export const WelcomeScreen = () => {
    const { t } = useTranslation();
    const { onStartCreate } = useOnboardingFlow();
    const signIn = useCreateExistingAccountConnector();
    const navigation = useNavigation<RootStackNavigationProp>();

    const handleSignIn = useCallback(async () => {
        signIn.reset();

        const connector = await signIn.mutateAsync();
        setActiveConnector(connector);
        navigation.navigate('SignInScreen', { connectionString: connector.connectionString });
    }, [signIn, navigation]);

    return (
        <Screen background="transparent">
            <ImageBackground source={resources.welcomeScreenBg} style={styles.background}>
                <Screen.Content>
                    <View style={styles.logoSection}>
                        <Image
                            source={resources.safelyLogo}
                            style={styles.logo}
                            contentFit="contain"
                        />
                    </View>

                    <View style={styles.spacer} />

                    <View style={styles.bottomSection}>
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

                        <Text
                            style={styles.legalText}
                            variant="bodyS"
                            color="tertiary"
                            textAlign="center"
                        >
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
                    </View>
                </Screen.Content>
            </ImageBackground>
        </Screen>
    );
};
