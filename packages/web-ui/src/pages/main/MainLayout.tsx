import type { FC, ReactNode } from 'react';
import { useState } from 'react';

import { dragRegionStyles } from './MainLayout.styles';
import { MainSidebar } from './MainSidebar';
import type { SettingsSection } from './settings';
import { SettingsContent } from './settings';
import { SettingsSidebar } from './SettingsSidebar';
import { AppLayout } from '../../shared';

export type MainLayoutProps = {
    hasWindowControls?: boolean;
    isFullScreen?: boolean;
    onAddWallet: () => void;
    onEditAccount: () => void;
    onAddAccount: () => void;
    onSignOut: () => void;
    onOpenDevTools: () => void;
    children: ReactNode;
};

export const MainLayout: FC<MainLayoutProps> = props => {
    const {
        hasWindowControls,
        isFullScreen,
        onAddWallet,
        onEditAccount,
        onAddAccount,
        onSignOut,
        onOpenDevTools,
        children
    } = props;

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [section, setSection] = useState<SettingsSection | null>(null);

    const toggleSettings = (): void => {
        setIsSettingsOpen(current => !current);
        setSection(null);
    };

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
                onOpenSettings={toggleSettings}
            />

            <SettingsSidebar
                activeSection={section}
                onSelectSection={setSection}
                onEditAccount={onEditAccount}
                onAddAccount={onAddAccount}
                onSignOut={onSignOut}
                onOpenDevTools={onOpenDevTools}
            />

            <AppLayout.Content>
                {section === null ? (
                    children
                ) : (
                    <SettingsContent section={section} onAddAccount={onAddAccount} />
                )}
            </AppLayout.Content>
        </AppLayout>
    );
};
