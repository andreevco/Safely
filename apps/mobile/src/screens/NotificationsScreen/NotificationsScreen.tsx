import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, View } from 'react-native';

import { SettingsStackNavigationProp } from '@mobile/app/navigation/types';
import { Banner, Cell, List, Screen, Switch } from '@mobile/shared/ui';
import { ArrowLeft16, Icon } from '@mobile/shared/ui/Icon';

import { styles } from './NotificationsScreen.styles';

export const NotificationsScreen = () => {
    const { t } = useTranslation();

    // TODO Real logic
    const [pushEnabled, setPushEnabled] = useState(false);
    const navigation = useNavigation<SettingsStackNavigationProp>();

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
                <View style={styles.container}>
                    <Banner
                        variant="warning"
                        text={t('notifications.warning')}
                        actionText={t('notifications.openSettings')}
                        onPress={handleOpenSettings}
                    />
                </View>
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
                            <Switch
                                value={pushEnabled}
                                onPress={() => setPushEnabled(!pushEnabled)}
                            />
                        </Cell>
                    </List.Group>
                </List>
            </Screen.Scrollable>
        </Screen>
    );
};
