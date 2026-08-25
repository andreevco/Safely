import { useNavigate, useRouteContext } from '@tanstack/react-router';
import type { FC } from 'react';
import { useState } from 'react';

import { PortfolioNetworkType } from '@safely/core';
import { useActiveAccountStoreSlot, useToast, useTranslate } from '@safely/ux';
import {
    AddWalletModal,
    CustomizeAccountModal,
    CustomizeWalletModal,
    ImportWalletModal,
    MainPage,
    SignOutModal,
    WalletAlreadyAddedModal,
    WatchAccountModal
} from '@safely/web-ui';

import { ROUTE } from './routes';
import { useAccountFlow } from './useAccountFlow';
import { useAddWalletFlow } from './useAddWalletFlow';
import { useSignOut } from './useSignOut';

export const MainRoute: FC = () => {
    const { hasWindowControls, isFullScreen } = useRouteContext({ from: '__root__' });
    const t = useTranslate();
    const toast = useToast();
    const navigate = useNavigate();
    const signOut = useSignOut();
    const addWallet = useAddWalletFlow();
    const account = useAccountFlow();
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

            {addWallet.step === 'menu' && (
                <AddWalletModal
                    onCreateNew={addWallet.startCreate}
                    onImportExisting={() => addWallet.openImport(PortfolioNetworkType.MAINNET)}
                    onWatchAccount={addWallet.openWatch}
                    onConnectLedger={() =>
                        toast({ message: t('common.errors.notSupportedYet'), type: 'error' })
                    }
                    onImportTestnet={() => addWallet.openImport(PortfolioNetworkType.TESTNET)}
                    onClose={addWallet.close}
                />
            )}

            {addWallet.step === 'import' && (
                <ImportWalletModal
                    onSubmit={mnemonic => void addWallet.onMnemonicReady(mnemonic)}
                    onClose={addWallet.open}
                />
            )}

            {addWallet.step === 'watch' && (
                <WatchAccountModal
                    onSubmit={addWallet.onWatchInputReady}
                    onClose={addWallet.open}
                />
            )}

            {addWallet.step === 'duplicate' && addWallet.duplicate && (
                <WalletAlreadyAddedModal
                    meta={addWallet.duplicate.meta}
                    onOpen={() => void addWallet.openDuplicate()}
                    onEdit={addWallet.editDuplicate}
                    onClose={addWallet.close}
                />
            )}

            {addWallet.step === 'customize' && addWallet.draft && (
                <CustomizeWalletModal
                    defaultName={addWallet.draft.name}
                    defaultIcon={addWallet.draft.icon}
                    onSave={meta => void addWallet.save(meta).catch(() => undefined)}
                    onClose={addWallet.close}
                />
            )}
        </>
    );
};
