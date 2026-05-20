import { useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { ImageBackground, View } from 'react-native';

import {
    useAppContext,
    useCreateExistingAccountConnector,
    useLinking,
    useTrackOnboardingOpen
} from '@safely/ux';

import { RootStackNavigationProp } from '@mobile/app/navigation/types';
import { useOnboardingFlow } from '@mobile/features/onboarding';
import { resources } from '@mobile/shared/resources';
import { Button, Icon, Safely96, Screen, Text } from '@mobile/shared/ui';

import { styles } from './WelcomeScreen.styles';

const TERMS_URL = 'https://google.com';
const PRIVACY_URL = 'https://google.com';

export const WelcomeScreen = () => {
    const { t } = useTranslation();
    const { onSuccessCreate, onSuccessSignIn } = useOnboardingFlow();
    const signIn = useCreateExistingAccountConnector();
    const navigation = useNavigation<RootStackNavigationProp>();
    const {
        storage: {
            sync: { getSecureEncrypted }
        }
    } = useAppContext();
    const { openURL } = useLinking();

    useTrackOnboardingOpen();

    const handleSignIn = useCallback(async () => {
        signIn.reset();

        // resource will be closed manually in `closeStorage` because it needs to be opened on the SignInScreen
        const secureEncryptedStorage = getSecureEncrypted();
        secureEncryptedStorage.UNSAFE_SKIP_SECURITY_CHECK_unlock();

        const connector = await signIn.mutateAsync({ secureEncryptedStorage });

        navigation.navigate('SignInScreen', {
            connector,
            closeStorage: () => secureEncryptedStorage[Symbol.dispose](),
            onSuccess: () =>
                navigation.navigate('SignInSuccessScreen', { onContinue: onSuccessSignIn })
        });
    }, [signIn, navigation, getSecureEncrypted, onSuccessSignIn]);

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
                        <Button type="primary" size="large" onPress={onSuccessCreate}>
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
                                            onPress={() => openURL(TERMS_URL)}
                                        />
                                    ),
                                    privacy: (
                                        <Text
                                            variant="bodyS"
                                            color="secondary"
                                            onPress={() => openURL(PRIVACY_URL)}
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
