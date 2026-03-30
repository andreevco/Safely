import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Pressable, View } from 'react-native';

import { useBootConfig } from '@safely/ux';

import { AppIcon96, Screen, Text } from '@mobile/shared/ui';
import { ChevronRight16, Icon } from '@mobile/shared/ui/Icon';

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
                    <Icon icon={AppIcon96} />
                    <View style={styles.titleBox}>
                        <Text variant="titleM" textAlign="center">
                            {t('safelyBeta.title')}
                        </Text>
                        <Text variant="bodyL" color="secondary" textAlign="center">
                            {t('safelyBeta.subtitle')}
                        </Text>
                    </View>
                </View>

                <View style={styles.infoBox}>
                    <Text variant="bodyM" color="primary">
                        {t('safelyBeta.feedback.description')}
                    </Text>
                    <Pressable style={styles.feedbackRow} onPress={handleFeedback}>
                        <Text variant="labelM" color="primary">
                            {t('safelyBeta.feedback.action')}
                        </Text>
                        <Icon icon={ChevronRight16} color="secondary" />
                    </Pressable>
                </View>
            </View>
        </Screen>
    );
};
