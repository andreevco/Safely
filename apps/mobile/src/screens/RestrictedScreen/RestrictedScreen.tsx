import { useNavigation } from '@react-navigation/core';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useBootConfig, useHasAccount } from '@safely/ux';

import { useLogOutAllConfirmation } from '@mobile/features/settings/useLogOutAllConfirmation';
import { Button, Screen, Text } from '@mobile/shared/ui';
import { Globe56, Icon } from '@mobile/shared/ui/Icon';

import { styles } from './RestrictedScreen.styles';

export const RestrictedScreen = () => {
    const { t } = useTranslation();
    const navigation = useNavigation();
    const hasAccount = useHasAccount();
    const handleLogOut = useLogOutAllConfirmation();

    const supportEmail = useBootConfig().references.support.email;

    return (
        <Screen>
            <Screen.Header variant="left">
                <Screen.Header.Title />
            </Screen.Header>

            <Screen.Content>
                <View style={styles.hero}>
                    <Icon icon={Globe56} />
                    <View style={styles.heroText}>
                        <Text variant="titleM" textAlign="center">
                            {t('restrictedRegion.title')}
                        </Text>
                        <Text variant="bodyL" color="secondary" textAlign="center">
                            {t('restrictedRegion.subtitle')} {supportEmail}
                        </Text>
                    </View>
                </View>

                {hasAccount && (
                    <View style={styles.footer}>
                        <Button
                            type="secondary"
                            size="large"
                            textProps={{ textAlign: 'center' }}
                            onPress={() =>
                                navigation.navigate('RestrictedFlow', {
                                    screen: 'RestrictedRecoveryScreen'
                                })
                            }
                        >
                            {t('restrictedRegion.exportRecoveryPhrases')}
                        </Button>
                        <Text
                            variant="bodyM"
                            color="tertiary"
                            textAlign="center"
                            onPress={handleLogOut}
                        >
                            {t('restrictedRegion.logOutAndErase')}
                        </Text>
                    </View>
                )}
            </Screen.Content>
        </Screen>
    );
};
