import { useNavigation } from '@react-navigation/core';
import { useCallback } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { ImageBackground, View } from 'react-native';

import {
    useAppContext,
    useBootConfig,
    useCreateExistingAccountConnector,
    useLinking,
    useTrackOnboardingOpen
} from '@safely/ux';

import { useOnboardingFlow } from '@mobile/features/onboarding';
import { TEST_ID } from '@mobile/shared/constants';
import { resources } from '@mobile/shared/resources';
import { Button, Icon, QrCodeScanShield28, Safely96, Screen, Text } from '@mobile/shared/ui';

import { styles } from './WelcomeScreen.styles';

export const WelcomeScreen = () => {
    const { t } = useTranslation();
    const { onSuccessCreate, onSuccessSignIn } = useOnboardingFlow();
    const signIn = useCreateExistingAccountConnector();
    const navigation = useNavigation();
    const privacyUrl = useBootConfig().references.legal.privacy_url;

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

        // don't ask for the password while setting app initially after first account creation during onboarding to provide smooth user experience
        secureEncryptedStorage.UNSAFE_SKIP_SECURITY_CHECK_unlock();

        const connector = await signIn.mutateAsync({ secureEncryptedStorage });

        navigation.navigate('SignInScreen', {
            connector,
            closeStorage: () => secureEncryptedStorage[Symbol.dispose](),
            onSuccess: (inviterIkPubHex: string | null) =>
                navigation.navigate('SignInSuccessScreen', {
                    inviterIkPubHex,
                    onContinue: onSuccessSignIn
                })
        });
    }, [signIn, navigation, getSecureEncrypted, onSuccessSignIn]);

    return (
        <Screen background="transparent">
            <Screen.Content>
                <ImageBackground source={resources.welcomeScreenBg} style={styles.background}>
                    <Icon icon={Safely96} style={styles.logo} />

                    <View style={styles.textContainer}>
                        <Text variant="titleM">{t('welcome.title')}</Text>
                        <Text variant="bodyL" color="secondary" textAlign="center">
                            {t('welcome.subtitle')}
                        </Text>
                    </View>

                    <View style={styles.buttonsContainer}>
                        <Button
                            testID={TEST_ID.welcome.createWallet}
                            type="primary"
                            size="large"
                            onPress={onSuccessCreate}
                        >
                            {t('welcome.newWallet')}
                        </Button>
                        <Button
                            testID={TEST_ID.welcome.importWallet}
                            type="secondary"
                            size="large"
                            onPress={() => navigation.navigate('OnboardingImportWalletScreen')}
                        >
                            {t('welcome.importWallet')}
                        </Button>
                        <Button
                            testID={TEST_ID.welcome.moreOptions}
                            type="secondary"
                            size="large"
                            onPress={() => navigation.navigate('MoreOptionsSheet')}
                        >
                            {t('welcome.moreOptions')}
                        </Button>
                        <Button
                            style={styles.lastButton}
                            testID={TEST_ID.welcome.qrSignIn}
                            type="blue"
                            size="large"
                            onPress={handleSignIn}
                        >
                            <View style={styles.buttonTextWithIcon}>
                                <Text variant="labelL" color="link">
                                    {t('welcome.linkWithQr')}
                                </Text>
                                <Icon icon={QrCodeScanShield28} />
                            </View>
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
                                    privacy: (
                                        <Text
                                            variant="bodyS"
                                            color="secondary"
                                            onPress={() => openURL(privacyUrl)}
                                        />
                                    )
                                }}
                            />
                        </Text>
                    </View>
                </ImageBackground>
            </Screen.Content>
        </Screen>
    );
};
