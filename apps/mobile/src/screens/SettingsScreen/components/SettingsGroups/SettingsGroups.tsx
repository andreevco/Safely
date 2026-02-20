import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Linking } from 'react-native';

import { useBootConfig } from '@safely/ux';

import { SettingsStackNavigationProp } from '@mobile/app/navigation/types';
import { Cell, List } from '@mobile/shared/ui';
import { Chevron } from '@mobile/shared/ui/Cell/components';

interface SettingsItem {
    key: string;
    titleKey: string;
    hasValue?: boolean;
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
            {
                key: 'language',
                titleKey: 'settings.groups.account.options.language',
                hasValue: true
            }
        ]
    },
    {
        titleKey: 'settings.groups.info.title',
        items: [
            {
                key: 'support',
                titleKey: 'settings.groups.info.options.support',
                hasValue: true
            },
            { key: 'faq', titleKey: 'settings.groups.info.options.faq' },
            { key: 'rate', titleKey: 'settings.groups.info.options.rate' },
            { key: 'legal', titleKey: 'settings.groups.info.options.legal' }
        ]
    }
];

export const SettingsGroups = () => {
    const { t } = useTranslation();
    const navigation = useNavigation<SettingsStackNavigationProp>();
    const supportEmail = useBootConfig().references.support.email;

    const getItemValue = (key: string): string | undefined => {
        if (key === 'language') return t('currentLanguageName');
        if (key === 'support') return supportEmail;
    };

    const handleItemPress = (key: string) => {
        if (key === 'language') {
            navigation.navigate('LanguageModal');
        }

        if (key === 'notifications') {
            navigation.navigate('NotificationsModal');
        }

        if (key === 'security') {
            navigation.navigate('SecurityModal');
        }

        if (key === 'support') {
            void Linking.openURL(`mailto:${supportEmail}`);
        }
    };

    return (
        <>
            {groups.map(group => (
                <List key={group.titleKey}>
                    <List.Title>{t(group.titleKey)}</List.Title>
                    <List.Group variant="divided">
                        {group.items.map(item => (
                            <Cell key={item.key} onPress={() => handleItemPress(item.key)}>
                                <Cell.Content>
                                    <Cell.Row>
                                        <Cell.Title>{t(item.titleKey)}</Cell.Title>
                                        {item.hasValue ? (
                                            <Cell.Value variant="bodyL" color="tertiary">
                                                {getItemValue(item.key)}
                                            </Cell.Value>
                                        ) : (
                                            <Chevron />
                                        )}
                                    </Cell.Row>
                                </Cell.Content>
                            </Cell>
                        ))}
                    </List.Group>
                </List>
            ))}
        </>
    );
};
