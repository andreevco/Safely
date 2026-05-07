import { useNavigation } from '@react-navigation/native';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native-gesture-handler';

import { useAccounts, useActiveAccount, useSetActiveAccount } from '@safely/ux';

import { RootStackNavigationProp } from '@mobile/app/navigation/types';
import { Button, Cell, Checkmark28, Icon, List, Screen } from '@mobile/shared/ui';

import { styles } from './SelectAccountSelectorModal.styles';

export const SelectAccountSelectorModal = () => {
    const { t } = useTranslation();
    const accounts = useAccounts();
    const account = useActiveAccount();
    const navigation = useNavigation<RootStackNavigationProp>();
    const { mutateAsync: setActiveAccount } = useSetActiveAccount();

    const handleSwitchAccount = async (accountId: string) => {
        if (accountId === account.accountId) {
            navigation.goBack();

            return;
        }

        impactAsync(ImpactFeedbackStyle.Medium);
        await setActiveAccount(accountId);

        navigation.goBack();
    };

    return (
        <Screen>
            <Screen.Header>
                <Screen.Header.Title>{t('accountSelector.title')}</Screen.Header.Title>
                <Screen.Header.CloseButton />
            </Screen.Header>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.contentContainer}
            >
                <List.Group variant="divided">
                    {accounts?.map(acc => {
                        const isActive = acc.accountId === account.accountId;
                        const portfolios = acc.syncProvider.get('portfolios');
                        const walletsCount = portfolios
                            ? Object.keys(portfolios.setById).length
                            : 0;
                        return (
                            <Cell
                                key={acc.accountId}
                                onPress={() => handleSwitchAccount(acc.accountId)}
                            >
                                <Cell.Content>
                                    <Cell.Row>
                                        <Cell.Title>{acc.meta.name}</Cell.Title>
                                    </Cell.Row>
                                    <Cell.Row>
                                        <Cell.Subtitle>
                                            {t('settings.walletsCount', { count: walletsCount })}
                                        </Cell.Subtitle>
                                    </Cell.Row>
                                </Cell.Content>
                                {isActive && <Icon icon={Checkmark28} color="accent" />}
                            </Cell>
                        );
                    })}
                </List.Group>
                <Button
                    type="secondary"
                    size="small"
                    style={styles.addButton}
                    onPress={() => navigation.navigate('AddAccountSheet')}
                >
                    {t('settings.addAccount')}
                </Button>
            </ScrollView>
        </Screen>
    );
};
