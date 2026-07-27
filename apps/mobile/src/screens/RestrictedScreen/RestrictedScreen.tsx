import { useNavigation } from '@react-navigation/core';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useBootConfig, useHasAccount, useLinking } from '@safely/ux';

import { useLogOutAllConfirmation } from '@mobile/features/settings/useLogOutAllConfirmation';
import { TEST_ID } from '@mobile/shared/constants';
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
            </Screen.Header>

            <Screen.Content>
                <View testID={TEST_ID.restricted.screen} style={styles.hero}>
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
                    <View style={styles.footer}>
                        <Button
                            testID={TEST_ID.restricted.exportRecoveryPhrases}
                            type="secondary"
                            size="large"
                            onPress={() => navigation.navigate('RestrictedRecoveryScreen')}
                        >
                            {t('restrictedRegion.exportRecoveryPhrases')}
                        </Button>
                        <Text
                            testID={TEST_ID.restricted.logOut}
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
