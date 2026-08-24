import type { FC } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router';

import { useActiveAccountStoreSlot } from '@safely/ux';

import { ROUTE } from './routes';
import { useAddWallet } from './useAddWallet';
import { useSignOut } from './useSignOut';
import { CustomizeWalletModal } from '../entities';
import { SignOutModal } from '../features';
import { MainPage } from '../pages';

export type MainRouteProps = {
    hasWindowControls?: boolean;
    isFullScreen?: boolean;
};

export const MainRoute: FC<MainRouteProps> = props => {
    const { hasWindowControls, isFullScreen } = props;

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
                onOpenDevTools={() => void navigate(ROUTE.devTools)}
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
