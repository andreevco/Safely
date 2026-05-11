import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Linking, View } from 'react-native';

import { SettingsStackNavigationProp } from '@mobile/app/navigation/types';
import { useNotificationsQuery, useToggleNotifications } from '@mobile/features/notifications';
import { Banner, Cell, List, Screen, Switch } from '@mobile/shared/ui';
import { ArrowLeft16, Icon } from '@mobile/shared/ui/Icon';

import { styles } from './NotificationsScreen.styles';

export const NotificationsScreen = () => {
    const { t } = useTranslation();
    const navigation = useNavigation<SettingsStackNavigationProp>();
    const { data: notifications } = useNotificationsQuery();
    const { mutateAsync: toggleNotifications } = useToggleNotifications();

    const { isEnabled = false, isDenied = false } = notifications ?? {};

    const handleToggle = async () => {
        await toggleNotifications(!isEnabled);
    };

    const handleOpenSettings = () => {
        void Linking.openSettings();
    };

    return (
        <Screen>
            <Screen.Header variant="center">
                <Screen.Header.Button onPress={navigation.goBack}>
                    <Icon icon={ArrowLeft16} />
                </Screen.Header.Button>
                <Screen.Header.Title>{t('notifications.title')}</Screen.Header.Title>
                <View style={styles.headerPlaceholder} />
            </Screen.Header>
            <Screen.Scrollable contentContainerStyle={styles.listContent}>
                {isDenied && (
                    <View style={styles.container}>
                        <Banner variant="warn" onPress={handleOpenSettings}>
                            <Banner.Content>
                                <Banner.Text>{t('notifications.warning')}</Banner.Text>
                            </Banner.Content>
                            <Banner.Action>{t('notifications.openSettings')}</Banner.Action>
                        </Banner>
                    </View>
                )}
                <List style={styles.container}>
                    <List.Group>
                        <Cell>
                            <Cell.Content>
                                <Cell.Row>
                                    <Cell.Title>{t('notifications.push.title')}</Cell.Title>
                                </Cell.Row>
                                <Cell.Row>
                                    <Cell.Subtitle>
                                        {t('notifications.push.subtitle')}
                                    </Cell.Subtitle>
                                </Cell.Row>
                            </Cell.Content>
                            <Switch value={isEnabled} onPress={handleToggle} />
                        </Cell>
                    </List.Group>
                </List>
            </Screen.Scrollable>
        </Screen>
    );
};
