import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { useRef } from 'react';

import { SyncAccount, useActiveAccount, useSetActiveAccount } from '@safely/ux';

import { RootStackNavigationProp } from '@mobile/app/navigation/types';
import { PopupMenuRef } from '@mobile/shared/ui/PopupMenu';

import { ModalAccountSelector } from './ModalAccountSelector';
import { PopupAccountSelector } from './PopupAccountSelector';
import { SingleAccountDisplay } from './SingleAccountDisplay';

const MAX_POPUP_ACCOUNTS = 5;

interface AccountSelectorProps {
    accounts: SyncAccount[];
    rootNavigation: RootStackNavigationProp;
}

export const AccountSelector = (props: AccountSelectorProps) => {
    const { accounts, rootNavigation } = props;
    const account = useActiveAccount();
    const { mutateAsync: setActiveAccount } = useSetActiveAccount();
    const popupMenuRef = useRef<PopupMenuRef>(null);

    const accountCount = accounts.length;
    const activeWalletsCount = account.syncProvider.get('portfolios')?.length ?? 0;

    const handleSwitchAccount = async (accountId: string) => {
        popupMenuRef.current?.close();

        if (accountId === account.accountId) return;

        void impactAsync(ImpactFeedbackStyle.Medium);
        await setActiveAccount(accountId);
    };

    const handleOpenAccountSelector = () => {
        rootNavigation.navigate('SelectAccountSelectorModal');
    };

    if (accountCount <= 1) {
        return <SingleAccountDisplay name={account.meta.name} walletsCount={activeWalletsCount} />;
    }

    if (accountCount <= MAX_POPUP_ACCOUNTS) {
        return (
            <PopupAccountSelector
                name={account.meta.name}
                walletsCount={activeWalletsCount}
                accounts={accounts}
                activeAccountId={account.accountId}
                onSwitchAccount={handleSwitchAccount}
                popupMenuRef={popupMenuRef}
            />
        );
    }

    return (
        <ModalAccountSelector
            name={account.meta.name}
            walletsCount={activeWalletsCount}
            onPress={handleOpenAccountSelector}
        />
    );
};
