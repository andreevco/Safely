import { useNavigation } from '@react-navigation/core';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useBootConfig, useHasAccount, useLinking } from '@safely/ux';

import { useLogOutAllConfirmation } from '@mobile/features/settings/useLogOutAllConfirmation';
import { Button, Screen, Text } from '@mobile/shared/ui';
import { Globe56, Icon } from '@mobile/shared/ui/Icon';

import { styles } from './RestrictedScreen.styles';

export const RestrictedScreen = () => {
    const { t } = useTranslation();
    const navigation = useNavigation();
    const hasAccount = useHasAccount();
    const handleLogOut = useLogOutAllConfirmation();

    const { openURL } = useLinking();
    const supportEmail = useBootConfig().references.support.email;

    return (
        <Screen>
            <Screen.Header variant="left">
                <Screen.Header.Title />
                {hasAccount && (
                    <Screen.Header.Button type="small" onPress={handleLogOut}>
                        <Text variant="labelM" color="primary">
                            {t('passcode.lockout.signOut')}
                        </Text>
                    </Screen.Header.Button>
                )}
            </Screen.Header>

            <Screen.Content>
                <View style={styles.hero}>
                    <Icon icon={Globe56} />
                    <View style={styles.heroText}>
                        <Text variant="titleM" textAlign="center">
                            {t('restrictedRegion.title')}
                        </Text>
                        <Text variant="bodyL" color="secondary" textAlign="center">
                            {t('restrictedRegion.subtitle')}{' '}
                            <Text
                                variant="bodyL"
                                color="secondary"
                                onPress={() => openURL(`mailto:${supportEmail}`)}
                            >
                                {supportEmail}
                            </Text>
                        </Text>
                    </View>
                </View>

                {hasAccount && (
                    <Button
                        type="secondary"
                        size="large"
                        style={styles.exportButton}
                        onPress={() => navigation.navigate('RestrictedRecoveryScreen')}
                    >
                        {t('restrictedRegion.exportRecoveryPhrases')}
                    </Button>
                )}
            </Screen.Content>
        </Screen>
    );
};
