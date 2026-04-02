import { RefObject } from 'react';
import { useTranslation } from 'react-i18next';

import { SyncAccount } from '@safely/ux';

import { Button, Cell, Checkmark28, Icon, List, PopupMenu } from '@mobile/shared/ui';
import { PopupMenuRef } from '@mobile/shared/ui/PopupMenu';

import { AccountCell } from './AccountCell';
import { AccountSelectorTouchable } from './AccountSelectorTouchable';
import { styles } from './PopupAccountSelector.styles';

interface PopupAccountSelectorProps {
    name: string;
    walletsCount: number;
    accounts: SyncAccount[];
    activeAccountId: string;
    onSwitchAccount: (accountId: string) => void;
    onAddAccount: () => void;
    popupMenuRef: RefObject<PopupMenuRef | null>;
}

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
        </PopupMenu>
    );
};
