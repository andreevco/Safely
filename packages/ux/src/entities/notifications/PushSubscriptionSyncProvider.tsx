import type { FC, PropsWithChildren } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';

import { NotificationSettings } from '@safely/core';

import { usePushNotificationsEnabledQuery, usePushPermissionQuery } from './device';
import type { AccountSubscriptionState } from './push-subscription-syncer';
import { PushSubscriptionSyncer } from './push-subscription-syncer';
import { useAppContext, useAppState, useNotificationsApi } from '../../shared';
import { useAccounts } from '../account/account-state';
import type { AccountStoreData } from '../account/sync-storage/account-store';
import { accountStore } from '../account/sync-storage/account-store';

const SYNC_DEBOUNCE_MS = 1000;

const PushSubscriptionSyncContext = createContext<PushSubscriptionSyncer | null>(null);

function toSubscriptionState(data: AccountStoreData | undefined): AccountSubscriptionState {
    if (!data) return { kind: 'pending' };

    return {
        kind: 'ready',
        portfolios: data.portfolios,
        settings: NotificationSettings.fromStored(data.notifications)
    };
}

function usePushSubscriptionSyncer(): PushSubscriptionSyncer | null {
    const api = useNotificationsApi();
    const { pushNotifications, build, storage, logger } = useAppContext();

    const syncer = useMemo(
        () =>
            api
                ? new PushSubscriptionSyncer({
                      api,
                      pushNotifications,
                      platform: build,
                      storage: storage.ux.regular,
                      logger: logger.child('push-subscription')
                  })
                : null,
        [api, pushNotifications, build, storage.ux.regular, logger]
    );

    useEffect(() => () => syncer?.dispose(), [syncer]);

    return syncer;
}

function usePushSubscriptionTriggers(syncer: PushSubscriptionSyncer | null): void {
    const accounts = useAccounts();
    const { data: permission } = usePushPermissionQuery();
    const { data: isPushEnabled } = usePushNotificationsEnabledQuery();
    const { current } = useAppState();

    useEffect(() => {
        if (!syncer || permission === undefined || isPushEnabled === undefined) return;
        if (current === 'background') return;

        const isPushActive = isPushEnabled && permission === 'granted';

        const run = () => {
            const { accountsData } = accountStore.getState();

            void syncer.sync({
                isPushActive,
                accounts: accounts.map(({ accountId }) => ({
                    accountId,
                    state: toSubscriptionState(accountsData.get(accountId))
                }))
            });
        };

        let timer: ReturnType<typeof setTimeout> | null = null;
        const unsubscribe = accountStore.subscribe(() => {
            if (timer) clearTimeout(timer);
            timer = setTimeout(run, SYNC_DEBOUNCE_MS);
        });

        run();

        return () => {
            if (timer) clearTimeout(timer);
            unsubscribe();
        };
    }, [syncer, accounts, permission, isPushEnabled, current]);
}

export function usePushSubscriptionReset(): () => Promise<void> {
    const syncer = useContext(PushSubscriptionSyncContext);

    return useCallback(() => syncer?.reset() ?? Promise.resolve(), [syncer]);
}

export const PushSubscriptionSyncProvider: FC<PropsWithChildren> = ({ children }) => {
    const syncer = usePushSubscriptionSyncer();
    usePushSubscriptionTriggers(syncer);

    return <PushSubscriptionSyncContext value={syncer}>{children}</PushSubscriptionSyncContext>;
};
