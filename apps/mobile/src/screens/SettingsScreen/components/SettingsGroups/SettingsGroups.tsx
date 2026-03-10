import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Linking, View } from 'react-native';

import { useActivePortfolio, useBootConfig } from '@safely/ux';

import { RootStackNavigationProp, SettingsStackNavigationProp } from '@mobile/app/navigation/types';
import { PortfolioName } from '@mobile/entities/portfolio';
import { Button, Cell, List } from '@mobile/shared/ui';

import { styles } from './SettingsGroups.styles';

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
            { key: 'rate', titleKey: 'settings.groups.info.options.rate' },
            { key: 'legal', titleKey: 'settings.groups.info.options.legal' }
        ]
    }
];

export const SettingsGroups = () => {
    const { t } = useTranslation();
    const navigation = useNavigation<SettingsStackNavigationProp & RootStackNavigationProp>();
    const supportEmail = useBootConfig().references.support.email;
    const activePortfolio = useActivePortfolio();

    const getItemValue = (key: string): string | undefined => {
        if (key === 'language') return t('currentLanguageName');
        if (key === 'support') return supportEmail;
        if (key === 'wallet') return t('common.edit');
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

        if (key === 'wallet') {
            navigation.navigate('CustomizeWalletModal', {
                portfolio: activePortfolio,
                onCompleteCustomize: () => {
                    navigation.pop();
                }
            });
        }
    };

    return (
        <>
            {/* We need to render PortfolioName so that's why I'm ignoring flow with groups mapping */}
            <List>
                <List.Title>{t('settings.groups.currentWallet.title')}</List.Title>
                <List.Group variant="divided">
                    <Cell onPress={() => handleItemPress('wallet')}>
                        <Cell.Content>
                            <Cell.Row>
                                <PortfolioName
                                    meta={activePortfolio.meta}
                                    fontVariant="labelL"
                                    gap={12}
                                    size={16}
                                />
                                <Cell.Value variant="bodyL" color="tertiary">
                                    {t('common.edit')}
                                </Cell.Value>
                            </Cell.Row>
                        </Cell.Content>
                    </Cell>
                </List.Group>
                <View style={styles.buttonContainer}>
                    <Button
                        type="secondary"
                        size="small"
                        onPress={() => navigation.navigate('AddWalletModal')}
                    >
                        {t('addWallet.title')}
                    </Button>
                </View>
            </List>
            {groups.map(group => (
                <List key={group.titleKey}>
                    <List.Title>{t(group.titleKey)}</List.Title>
                    <List.Group variant="divided">
                        {group.items.map(item => (
                            <Cell key={item.key} onPress={() => handleItemPress(item.key)}>
                                <Cell.Content>
                                    <Cell.Row>
                                        <Cell.Title>{t(item.titleKey)}</Cell.Title>
                                        {item.hasValue && (
                                            <Cell.Value variant="bodyL" color="tertiary">
                                                {getItemValue(item.key)}
                                            </Cell.Value>
                                        )}
                                    </Cell.Row>
                                </Cell.Content>
                                {!item.hasValue && <Cell.Chevron />}
                            </Cell>
                        ))}
                    </List.Group>
                </List>
            ))}
        </>
    );
};
