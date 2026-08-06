import { useNavigation } from '@react-navigation/core';
import type { StaticScreenProps } from '@react-navigation/native';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native-gesture-handler';

import {
    useAccountMeta,
    useAccounts,
    useAccountStoreSlot,
    useActiveAccount,
    useSetActiveAccount
} from '@safely/ux';

import { Button, Cell, Checkmark28, Icon, List, Screen } from '@mobile/shared/ui';

import { styles } from './SelectAccountSelectorModal.styles';

interface AccountListItemProps {
    accountId: string;
    isActive: boolean;
    showDivider?: boolean;
    onPress: () => void;
}

const AccountListItem = (props: AccountListItemProps) => {
    const { accountId, isActive, showDivider, onPress } = props;

    const { t } = useTranslation();
    const name = useAccountMeta(accountId).name;
    const walletsCount = useAccountStoreSlot(accountId, 'portfolios')?.length ?? 0;

    return (
        <Cell showDivider={showDivider} onPress={onPress}>
            <Cell.Content>
                <Cell.Row>
                    <Cell.Title>{name}</Cell.Title>
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
};

type SelectAccountSelectorModalProps = StaticScreenProps<{ hasAddAccount?: boolean } | undefined>;

export const SelectAccountSelectorModal = (props: SelectAccountSelectorModalProps) => {
    const hasAddAccount = props.route.params?.hasAddAccount ?? false;

    const { t } = useTranslation();
    const accounts = useAccounts();
    const account = useActiveAccount();
    const navigation = useNavigation();
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
                    {accounts?.map(acc => (
                        <AccountListItem
                            key={acc.accountId}
                            accountId={acc.accountId}
                            isActive={acc.accountId === account.accountId}
                            onPress={() => handleSwitchAccount(acc.accountId)}
                        />
                    ))}
                </List.Group>
                {hasAddAccount && (
                    <Button
                        type="secondary"
                        size="small"
                        style={styles.addButton}
                        onPress={() => navigation.navigate('AddAccountSheet')}
                    >
                        {t('settings.addAccount')}
                    </Button>
                )}
            </ScrollView>
        </Screen>
    );
};
