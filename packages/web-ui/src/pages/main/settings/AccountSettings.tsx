import type { FC } from 'react';

import { useAccounts, useActiveAccount, useSetActiveAccount, useTranslate } from '@safely/ux';

import { addAccountStyles, listStyles } from './SettingsSection.styles';
import { AccountCell } from '../../../entities';
import { Button, List, PageHeader } from '../../../shared';

export type AccountSettingsProps = {
    onAddAccount: () => void;
};

export const AccountSettings: FC<AccountSettingsProps> = props => {
    const t = useTranslate();
    const accounts = useAccounts();
    const { accountId: activeAccountId } = useActiveAccount();
    const { mutate: setActiveAccount } = useSetActiveAccount();

    return (
        <>
            <PageHeader title={t('account.title')} hasDivider />

            <List className={listStyles}>
                <List.Group variant="separated">
                    {accounts.map(account => (
                        <AccountCell
                            key={account.accountId}
                            accountId={account.accountId}
                            isActive={account.accountId === activeAccountId}
                            onSelect={() =>
                                account.accountId !== activeAccountId &&
                                setActiveAccount(account.accountId)
                            }
                        />
                    ))}
                </List.Group>

                <Button
                    variant="secondary"
                    isFullWidth
                    className={addAccountStyles}
                    onClick={props.onAddAccount}
                >
                    {t('settings.addAccount')}
                </Button>
            </List>
        </>
    );
};
