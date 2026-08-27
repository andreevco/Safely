import type { FC } from 'react';
import { useEffect, useState } from 'react';

import { useHasPortfolio } from '@safely/ux';

import { MainContent, MainEmptyState } from './content';
import { dragRegionStyles } from './MainPage.styles';
import { MainSidebar } from './MainSidebar';
import type { SettingsSection } from './settings';
import { SettingsContent } from './settings';
import { SettingsSidebar } from './SettingsSidebar';
import { AccountModals, AddWalletModals, useAccountFlow, useAddWalletFlow } from '../../features';
import { AppLayout } from '../../shared';
import { DevToolsPage } from '../dev-tools';

export type MainPageProps = {
    hasWindowControls?: boolean;
    isFullScreen?: boolean;
};

export const MainPage: FC<MainPageProps> = props => {
    const { hasWindowControls, isFullScreen } = props;

    const hasPortfolio = useHasPortfolio();
    const addWallet = useAddWalletFlow();
    const account = useAccountFlow();

    const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [section, setSection] = useState<SettingsSection | null>(null);

    useEffect(() => {
        if (!hasPortfolio) {
            setSection(current => (current === 'wallet' ? null : current));
        }
    }, [hasPortfolio]);

    const toggleSettings = (): void => {
        setIsSettingsOpen(current => !current);
        setSection(null);
    };

    if (isDevToolsOpen) {
        return (
            <DevToolsPage
                hasWindowControls={hasWindowControls}
                isFullScreen={isFullScreen}
                onClose={() => setIsDevToolsOpen(false)}
            />
        );
    }

    const content = hasPortfolio ? (
        <MainContent />
    ) : (
        <MainEmptyState onAddWallet={addWallet.open} />
    );

    return (
        <AppLayout
            hasWindowControls={hasWindowControls}
            isFullScreen={isFullScreen}
            isSecondaryOpen={isSettingsOpen}
        >
            <AppLayout.TitleBar className={dragRegionStyles} />

            <MainSidebar
                onAddWallet={addWallet.open}
                onOpenUpdates={() => undefined}
                onOpenSafety={() => undefined}
                onOpenSettings={toggleSettings}
            />

            <SettingsSidebar
                activeSection={section}
                account={account}
                onSelectSection={setSection}
                onOpenDevTools={() => setIsDevToolsOpen(true)}
            />

            <AppLayout.Content>
                {section === null ? (
                    content
                ) : (
                    <SettingsContent section={section} account={account} />
                )}
            </AppLayout.Content>

            <AddWalletModals flow={addWallet} />
            <AccountModals flow={account} />
        </AppLayout>
    );
};
