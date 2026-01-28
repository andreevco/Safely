import { Cell, List, Screen } from '@mobile/shared/ui';
import { TouchableOpacity } from '@mobile/shared/ui/TouchableOpacity';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { styles } from './SettingsScreen.styles';

interface SettingsItem {
    key: string;
    titleKey: string;
    onPress?: () => void;
}

interface SettingsGroup {
    titleKey: string;
    items: SettingsItem[];
}

const groups: SettingsGroup[] = [
    {
        titleKey: 'settings.groups.account.title',
        items: [
            { key: 'notifications', titleKey: 'settings.groups.account.options.notifications' },
            { key: 'security', titleKey: 'settings.groups.account.options.security' },
            { key: 'language', titleKey: 'settings.groups.account.options.language' }
        ]
    },
    {
        titleKey: 'settings.groups.info.title',
        items: [
            { key: 'support', titleKey: 'settings.groups.info.options.support' },
            { key: 'faq', titleKey: 'settings.groups.info.options.faq' },
            { key: 'rate', titleKey: 'settings.groups.info.options.rate' },
            { key: 'legal', titleKey: 'settings.groups.info.options.legal' }
        ]
    }
];

export const SettingsScreen = () => {
    const { t } = useTranslation();

    return (
        <Screen>
            <Screen.Header variant="center">
                <View style={styles.headerPlaceholder} />
                <Screen.Header.Title>{t('settings.title')}</Screen.Header.Title>
                <Screen.Header.CloseButton />
            </Screen.Header>
            <Screen.Scrollable contentContainerStyle={styles.container}>
                {groups.map(group => (
                    <List key={group.titleKey}>
                        <List.Title>{t(group.titleKey)}</List.Title>
                        <List.Group variant="divided">
                            {group.items.map(item => (
                                <TouchableOpacity key={item.key} onPress={item.onPress}>
                                    <Cell>
                                        <Cell.Content>
                                            <Cell.Row>
                                                <Cell.Title>{t(item.titleKey)}</Cell.Title>
                                            </Cell.Row>
                                        </Cell.Content>
                                        <Cell.Chevron />
                                    </Cell>
                                </TouchableOpacity>
                            ))}
                        </List.Group>
                    </List>
                ))}
            </Screen.Scrollable>
        </Screen>
    );
};
