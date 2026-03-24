import { RefObject } from 'react';
import { View } from 'react-native';

import { SyncAccount } from '@safely/ux';

import { Cell, Checkmark28, Icon, List, PopupMenu, Switch16 } from '@mobile/shared/ui';
import { PopupMenuRef } from '@mobile/shared/ui/PopupMenu';

import { AccountCell } from './AccountCell';

interface PopupAccountSelectorProps {
    name: string;
    walletsCount: number;
    accounts: SyncAccount[];
    activeAccountId: string;
    onSwitchAccount: (accountId: string) => void;
    popupMenuRef: RefObject<PopupMenuRef | null>;
}

export const PopupAccountSelector = (props: PopupAccountSelectorProps) => {
    const { name, walletsCount, accounts, activeAccountId, onSwitchAccount, popupMenuRef } = props;

    return (
        <PopupMenu
            ref={popupMenuRef}
            variant="fullWidth"
            touchable={
                <View pointerEvents="none">
                    <List.Group withoutBottomMargin>
                        <Cell>
                            <AccountCell name={name} walletsCount={walletsCount} />
                            <Icon icon={Switch16} color="tertiary" />
                        </Cell>
                    </List.Group>
                </View>
            }
        >
            <List.Group variant="divided">
                {accounts.map(acc => {
                    const isActive = acc.accountId === activeAccountId;
                    const accWalletsCount = acc.syncProvider.get('portfolios')?.length ?? 0;

                    return (
                        <Cell key={acc.accountId} onPress={() => onSwitchAccount(acc.accountId)}>
                            <AccountCell name={acc.meta.name} walletsCount={accWalletsCount} />
                            {isActive && <Icon icon={Checkmark28} color="accent" />}
                        </Cell>
                    );
                })}
            </List.Group>
        </PopupMenu>
    );
};
