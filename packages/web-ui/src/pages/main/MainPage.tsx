import type { FC, ReactNode } from 'react';
import { useEffect, useState } from 'react';

import type { ActivityItem, BtcActivityItem } from '@safely/ux';
import {
    AccountLinkState,
    isBtcActivityItem,
    useAccountLinkState,
    useActivePortfolio,
    useBetaFeedWatched,
    useHasPortfolio,
    useIsAttentionRequired
} from '@safely/ux';

import { MainContent, MainEmptyState } from './content';
import { dragRegionStyles } from './MainPage.styles';
import { MainSidebar } from './MainSidebar';
import type { SettingsSection } from './settings';
import { SettingsContent } from './settings';
import { SettingsSidebar } from './SettingsSidebar';
import {
    AccountModals,
    AddWalletModals,
    ReceiveModals,
    SafetyContent,
    SendModals,
    TransactionDetails,
    UpdatesContent,
    useAccountFlow,
    useAddWalletFlow,
    useReceiveFlow,
    useSendFlow
} from '../../features';
import { AppLayout } from '../../shared';
import { DevToolsPage } from '../dev-tools';

type MainView =
    | { kind: 'home' }
    | { kind: 'updates' }
    | { kind: 'safety' }
    | { kind: 'settings'; section: SettingsSection | null };

export type MainPageProps = {
    hasWindowControls?: boolean;
    isFullScreen?: boolean;
    security: ReactNode;
};

export const MainPage: FC<MainPageProps> = props => {
    const { hasWindowControls, isFullScreen, security } = props;

    const hasPortfolio = useHasPortfolio();
    const portfolioId = useActivePortfolio()?.id.toString();
    const addWallet = useAddWalletFlow();
    const account = useAccountFlow();
    const send = useSendFlow();
    const receive = useReceiveFlow();

    const { shouldShowBadge, markWatched } = useBetaFeedWatched();
    const linkState = useAccountLinkState();
    const isAttentionRequired = useIsAttentionRequired();

    const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);
    const [view, setView] = useState<MainView>({ kind: 'home' });
    const [selectedActivity, setSelectedActivity] = useState<BtcActivityItem | null>(null);

    const section = view.kind === 'settings' ? view.section : null;

    useEffect(() => {
        if (hasPortfolio) {
            return;
        }

        setView(current =>
            current.kind === 'settings' && current.section === 'wallet'
                ? { ...current, section: null }
                : current
        );
    }, [hasPortfolio]);

    useEffect(() => setSelectedActivity(null), [portfolioId]);

    const changeView = (next: MainView): void => {
        setView(next);
        setSelectedActivity(null);
    };

    const toggleSettings = (): void =>
        changeView(
            view.kind === 'settings' ? { kind: 'home' } : { kind: 'settings', section: null }
        );

    const openHome = (): void => changeView({ kind: 'home' });

    const openUpdates = (): void => {
        changeView({ kind: 'updates' });
        void markWatched();
    };

    const openSafety = (): void => changeView({ kind: 'safety' });

    const selectSection = (next: SettingsSection): void =>
        changeView({ kind: 'settings', section: next });

    /* orders have no detail view on the web targets yet */
    const selectActivity = (activity: ActivityItem): void =>
        isBtcActivityItem(activity) ? setSelectedActivity(activity) : undefined;

    if (isDevToolsOpen) {
        return (
            <DevToolsPage
                hasWindowControls={hasWindowControls}
                isFullScreen={isFullScreen}
                onClose={() => setIsDevToolsOpen(false)}
            />
        );
    }

    const home = hasPortfolio ? (
        <MainContent
            selectedActivityKey={selectedActivity?.key}
            onSend={send.open}
            onReceive={receive.open}
            onSelectActivity={selectActivity}
        />
    ) : (
        <MainEmptyState onAddWallet={addWallet.open} />
    );

    const safetyNotice = isAttentionRequired
        ? 'attention'
        : linkState === AccountLinkState.SOLO
          ? 'unprotected'
          : undefined;

    const content =
        view.kind === 'updates' ? (
            <UpdatesContent />
        ) : view.kind === 'safety' ? (
            <SafetyContent onAddAccount={account.openAdd} />
        ) : (
            home
        );

    return (
        <AppLayout
            hasWindowControls={hasWindowControls}
            isFullScreen={isFullScreen}
            isSecondaryOpen={view.kind === 'settings'}
            isPanelOpen={selectedActivity !== null}
        >
            <AppLayout.TitleBar className={dragRegionStyles} />

            <MainSidebar
                hasUpdates={shouldShowBadge}
                safetyNotice={safetyNotice}
                isUpdatesOpen={view.kind === 'updates'}
                isSafetyOpen={view.kind === 'safety'}
                onAddWallet={addWallet.open}
                onSelectWallet={openHome}
                onOpenUpdates={openUpdates}
                onOpenSafety={openSafety}
                onOpenSettings={toggleSettings}
            />

            <SettingsSidebar
                activeSection={section}
                account={account}
                onSelectSection={selectSection}
                onOpenDevTools={() => setIsDevToolsOpen(true)}
            />

            <AppLayout.Content>
                {section === null ? (
                    content
                ) : (
                    <SettingsContent section={section} account={account} security={security} />
                )}
            </AppLayout.Content>

            <AppLayout.Panel>
                <AppLayout.PanelContent>
                    {selectedActivity !== null && (
                        <TransactionDetails
                            activity={selectedActivity}
                            onClose={() => setSelectedActivity(null)}
                        />
                    )}
                </AppLayout.PanelContent>
            </AppLayout.Panel>

            <AddWalletModals flow={addWallet} />
            <AccountModals flow={account} />
            <SendModals flow={send} />
            <ReceiveModals flow={receive} />
        </AppLayout>
    );
};
