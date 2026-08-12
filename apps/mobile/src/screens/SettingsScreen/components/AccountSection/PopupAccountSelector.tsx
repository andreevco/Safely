import type { RefObject } from 'react';
import { useTranslation } from 'react-i18next';

import type { SyncAccount } from '@safely/ux';
import { useAccountMeta, useAccountStoreSlot } from '@safely/ux';

import { Button, Cell, Checkmark28, Icon, List, PopupMenu } from '@mobile/shared/ui';
import type { PopupMenuRef } from '@mobile/shared/ui/PopupMenu';

import { AccountCell } from './AccountCell';
import { AccountSelectorTouchable } from './AccountSelectorTouchable';
import { styles } from './PopupAccountSelector.styles';

interface PopupAccountSelectorProps {
    name: string;
    walletsCount: number;
    accounts: SyncAccount[];
    activeAccountId: string;
    onSwitchAccount: (accountId: string) => void;
    onAddAccount?: () => void;
    popupMenuRef: RefObject<PopupMenuRef | null>;
}

interface AccountRowProps {
    accountId: string;
    isActive: boolean;
    showDivider?: boolean;
    onPress: () => void;
}

const AccountRow = (props: AccountRowProps) => {
    const { accountId, isActive, showDivider, onPress } = props;

    const name = useAccountMeta(accountId).name;
    const walletsCount = useAccountStoreSlot(accountId, 'portfolios')?.length ?? 0;

    return (
        <Cell showDivider={showDivider} onPress={onPress}>
            <AccountCell name={name} walletsCount={walletsCount} />
            {isActive && <Icon icon={Checkmark28} color="accent" />}
        </Cell>
    );
};

export const PopupAccountSelector = (props: PopupAccountSelectorProps) => {
    const {
        name,
        walletsCount,
        accounts,
        activeAccountId,
        onSwitchAccount,
        onAddAccount,
        popupMenuRef
    } = props;
    const { t } = useTranslation();

    return (
        <PopupMenu
            menuMargin={2}
            ref={popupMenuRef}
            variant="fullWidth"
            touchable={progress => (
                <AccountSelectorTouchable
                    progress={progress}
                    name={name}
                    walletsCount={walletsCount}
                />
            )}
        >
            <List.Group withoutBottomMargin variant="divided">
                {accounts.map(acc => (
                    <AccountRow
                        key={acc.accountId}
                        accountId={acc.accountId}
                        isActive={acc.accountId === activeAccountId}
                        onPress={() => onSwitchAccount(acc.accountId)}
                    />
                ))}
            </List.Group>
            {onAddAccount && (
                <Button
                    style={styles.addButton}
                    type="secondary"
                    size="small"
                    onPress={() => {
                        popupMenuRef.current?.close();
                        onAddAccount();
                    }}
                >
                    {t('settings.addAccount')}
                </Button>
            )}
        </PopupMenu>
    );
};
