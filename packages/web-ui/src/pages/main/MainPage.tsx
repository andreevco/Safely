import type { FC } from 'react';

import type { Contact } from '@safely/core';
import { useHasPortfolio } from '@safely/ux';

import { MainContent } from './MainContent';
import { MainEmptyState } from './MainEmptyState';
import { MainLayout } from './MainLayout';
import type { SecuritySettingsProps } from './settings';

export type MainPageProps = {
    hasWindowControls?: boolean;
    isFullScreen?: boolean;
    security?: SecuritySettingsProps;
    onAddWallet: () => void;
    onEditAccount: () => void;
    onAddAccount: () => void;
    onAddContact: () => void;
    onOpenContact: (contact: Contact) => void;
    onSelectWallet: () => void;
    onEditWallet: () => void;
    onRevealRecoveryPhrase: () => void;
    onRemoveWallet: () => void;
    onSignOut: () => void;
    onOpenDevTools: () => void;
};

export const MainPage: FC<MainPageProps> = props => {
    const hasPortfolio = useHasPortfolio();

    return (
        <MainLayout {...props}>
            {hasPortfolio ? <MainContent /> : <MainEmptyState onAddWallet={props.onAddWallet} />}
        </MainLayout>
    );
};
