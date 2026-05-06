import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, View } from 'react-native';

import { useBootConfig } from '@safely/ux';

import { resources } from '@mobile/shared/resources';
import { Banner, Image, Screen, Text } from '@mobile/shared/ui';

import { styles } from './SafelyBetaScreen.styles';

export const SafelyBetaScreen = () => {
    const { t } = useTranslation();
    const supportEmail = useBootConfig().references.support.email;

    const handleFeedback = useCallback(() => {
        void Linking.openURL(`mailto:${supportEmail}`);
    }, [supportEmail]);

    return (
        <Screen>
            <Screen.Header />
            <View style={styles.container}>
                <View style={styles.centerBlock}>
                    <Image source={resources.safelyLogoWithBg} style={styles.logo} />
                    <View style={styles.titleBox}>
                        <Text variant="titleM" textAlign="center">
                            {t('safelyBeta.title')}
                        </Text>
                        <Text variant="bodyL" color="secondary" textAlign="center">
                            {t('safelyBeta.subtitle')}
                        </Text>
                    </View>
                </View>
                <Banner style={styles.banner} onPress={handleFeedback}>
                    <Banner.Content>
                        <Banner.Text>{t('safelyBeta.feedback.description')}</Banner.Text>
                    </Banner.Content>
                    <Banner.Action>{t('safelyBeta.feedback.action')}</Banner.Action>
                </Banner>
            </View>
        </Screen>
    );
};
