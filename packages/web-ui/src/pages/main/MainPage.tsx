import type { FC } from 'react';
import { useEffect, useState } from 'react';

import type { ActivityItem, BtcActivityItem } from '@safely/ux';
import { isBtcActivityItem, useActivePortfolio, useHasPortfolio } from '@safely/ux';

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
    SendModals,
    TransactionDetails,
    useAccountFlow,
    useAddWalletFlow,
    useReceiveFlow,
    useSendFlow
} from '../../features';
import { AppLayout } from '../../shared';
import { DevToolsPage } from '../dev-tools';

export type MainPageProps = {
    hasWindowControls?: boolean;
    isFullScreen?: boolean;
};

export const MainPage: FC<MainPageProps> = props => {
    const { hasWindowControls, isFullScreen } = props;

    const hasPortfolio = useHasPortfolio();
    const portfolioId = useActivePortfolio()?.id.toString();
    const addWallet = useAddWalletFlow();
    const account = useAccountFlow();
    const send = useSendFlow();
    const receive = useReceiveFlow();

    const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [section, setSection] = useState<SettingsSection | null>(null);
    const [selectedActivity, setSelectedActivity] = useState<BtcActivityItem | null>(null);

    useEffect(() => {
        if (!hasPortfolio) {
            setSection(current => (current === 'wallet' ? null : current));
        }
    }, [hasPortfolio]);

    useEffect(() => setSelectedActivity(null), [portfolioId]);

    const toggleSettings = (): void => {
        setIsSettingsOpen(current => !current);
        setSection(null);
    };

    const selectSection = (next: SettingsSection): void => {
        setSection(next);
        setSelectedActivity(null);
    };

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

    const content = hasPortfolio ? (
        <MainContent
            selectedActivityKey={selectedActivity?.key}
            onSend={send.open}
            onReceive={receive.open}
            onSelectActivity={selectActivity}
        />
    ) : (
        <MainEmptyState onAddWallet={addWallet.open} />
    );

    return (
        <AppLayout
            hasWindowControls={hasWindowControls}
            isFullScreen={isFullScreen}
            isSecondaryOpen={isSettingsOpen}
            isPanelOpen={selectedActivity !== null}
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
                onSelectSection={selectSection}
                onOpenDevTools={() => setIsDevToolsOpen(true)}
            />

            <AppLayout.Content>
                {section === null ? (
                    content
                ) : (
                    <SettingsContent section={section} account={account} />
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
