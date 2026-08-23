import type { FC } from 'react';

import { useHasPortfolio } from '@safely/ux';

import { MainContent } from './MainContent';
import { MainEmptyState } from './MainEmptyState';
import { MainLayout } from './MainLayout';

export type MainPageProps = {
    hasWindowControls?: boolean;
    isFullScreen?: boolean;
    onAddWallet: () => void;
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
