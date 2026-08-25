import { useNavigate, useRouteContext } from '@tanstack/react-router';
import type { FC } from 'react';
import { useState } from 'react';

import { useActiveAccountStoreSlot } from '@safely/ux';
import { CustomizeAccountModal, MainPage, SignOutModal } from '@safely/web-ui';

import { AddWalletModals } from './AddWalletModals';
import { ContactModals } from './ContactModals';
import { ROUTE } from './routes';
import { useAccountFlow } from './useAccountFlow';
import { useAddressBookFlow } from './useAddressBookFlow';
import { useAddWalletFlow } from './useAddWalletFlow';
import { useSignOut } from './useSignOut';
import { useWalletFlow } from './useWalletFlow';
import { WalletModals } from './WalletModals';

export const MainRoute: FC = () => {
    const { hasWindowControls, isFullScreen } = useRouteContext({ from: '__root__' });
    const navigate = useNavigate();
    const signOut = useSignOut();
    const wallet = useWalletFlow();
    const addWallet = useAddWalletFlow();
    const account = useAccountFlow();
    const addressBook = useAddressBookFlow();
    const accountMeta = useActiveAccountStoreSlot('meta');
    const [isSigningOut, setIsSigningOut] = useState(false);

    return (
        <>
            <MainPage
                hasWindowControls={hasWindowControls}
                isFullScreen={isFullScreen}
                onAddWallet={addWallet.open}
                onEditAccount={account.startEdit}
                onAddAccount={account.startCreate}
                onAddContact={addressBook.startCreate}
                onOpenContact={addressBook.openContact}
                onSelectWallet={wallet.openSelect}
                onEditWallet={wallet.openEdit}
                onRevealRecoveryPhrase={wallet.openReveal}
                onRemoveWallet={wallet.openRemove}
                onSignOut={() => setIsSigningOut(true)}
                onOpenDevTools={() => void navigate({ to: ROUTE.devTools })}
            />

            {isSigningOut && (
                <SignOutModal
                    accountName={accountMeta?.name ?? ''}
                    onConfirm={() => {
                        setIsSigningOut(false);
                        void signOut();
                    }}
                    onClose={() => setIsSigningOut(false)}
                />
            )}

            {account.draft && (
                <CustomizeAccountModal
                    defaultName={account.draft.name}
                    onSave={name => void account.save(name)}
                    onClose={account.cancel}
                />
            )}

            <ContactModals flow={addressBook} />
            <WalletModals flow={wallet} />
            <AddWalletModals flow={addWallet} />
        </>
    );
};
