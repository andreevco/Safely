import type { FC, ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { useHasPortfolio } from '@safely/ux';

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
    onSelectWallet: () => void;
    onEditWallet: () => void;
    onRevealRecoveryPhrase: () => void;
    onRemoveWallet: () => void;
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
        onSelectWallet,
        onEditWallet,
        onRevealRecoveryPhrase,
        onRemoveWallet,
        onSignOut,
        onOpenDevTools,
        children
    } = props;

    const hasPortfolio = useHasPortfolio();
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
                    <SettingsContent
                        section={section}
                        onAddAccount={onAddAccount}
                        onSelectWallet={onSelectWallet}
                        onEditWallet={onEditWallet}
                        onRevealRecoveryPhrase={onRevealRecoveryPhrase}
                        onRemoveWallet={onRemoveWallet}
                    />
                )}
            </AppLayout.Content>
        </AppLayout>
    );
};
