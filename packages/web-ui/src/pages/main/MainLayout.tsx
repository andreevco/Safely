import type { FC, ReactNode } from 'react';
import { useState } from 'react';

import { dragRegionStyles } from './MainLayout.styles';
import { MainSidebar } from './MainSidebar';
import { SettingsSidebar } from './SettingsSidebar';
import { AppLayout } from '../../shared';

export type MainLayoutProps = {
    hasWindowControls?: boolean;
    isFullScreen?: boolean;
    onAddWallet: () => void;
    onSignOut: () => void;
    children: ReactNode;
};

export const MainLayout: FC<MainLayoutProps> = props => {
    const { hasWindowControls, isFullScreen, onAddWallet, onSignOut, children } = props;

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    return (
        <AppLayout
            hasWindowControls={hasWindowControls}
            isFullScreen={isFullScreen}
            isSecondaryOpen={isSettingsOpen}
        >
            <AppLayout.TitleBar className={dragRegionStyles} />

            <MainSidebar
                onAddWallet={onAddWallet}
                onOpenUpdates={() => undefined}
                onOpenSafety={() => undefined}
                onOpenSettings={() => setIsSettingsOpen(current => !current)}
            />

            <SettingsSidebar onAddWallet={onAddWallet} onSignOut={onSignOut} />

            <AppLayout.Content>{children}</AppLayout.Content>
        </AppLayout>
    );
};
