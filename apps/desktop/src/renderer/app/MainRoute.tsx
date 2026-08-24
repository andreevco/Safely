import { useNavigate, useRouteContext } from '@tanstack/react-router';
import type { FC } from 'react';
import { useState } from 'react';

import { useActiveAccountStoreSlot } from '@safely/ux';
import { CustomizeWalletModal, MainPage, SignOutModal } from '@safely/web-ui';

import { ROUTE } from './routes';
import { useAddWallet } from './useAddWallet';
import { useSignOut } from './useSignOut';

export const MainRoute: FC = () => {
    const { hasWindowControls, isFullScreen } = useRouteContext({ from: '__root__' });
    const navigate = useNavigate();
    const signOut = useSignOut();
    const addWallet = useAddWallet();
    const accountMeta = useActiveAccountStoreSlot('meta');
    const [isSigningOut, setIsSigningOut] = useState(false);

    return (
        <>
            <MainPage
                hasWindowControls={hasWindowControls}
                isFullScreen={isFullScreen}
                onAddWallet={addWallet.start}
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

            {addWallet.draft && (
                <CustomizeWalletModal
                    defaultName={addWallet.draft.name}
                    defaultIcon={addWallet.draft.icon}
                    onSave={meta => void addWallet.save(meta).catch(() => undefined)}
                    onClose={addWallet.cancel}
                />
            )}
        </>
    );
};
