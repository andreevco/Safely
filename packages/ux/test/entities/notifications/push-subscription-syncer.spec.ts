import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { IPushNotifications, NotificationsApi, Portfolio } from '@safely/core';
import {
    NotificationSettings,
    PortfolioNetworkType,
    PortfolioWatchOnlyBtc,
    WatchOnlySource
} from '@safely/core';
import type { Logger } from '@safely/sync';

import type { PushSyncInput } from '../../../src/entities/notifications/push-subscription-syncer';
import { PushSubscriptionSyncer } from '../../../src/entities/notifications/push-subscription-syncer';
import { InMemoryTreeStorage } from '../../harness';

const ADDRESS = 'bc1q5v68nzc6rjgcl8ug0slpx77ucm4spnwzkwkqy2';

function portfolio(address = ADDRESS): Portfolio {
    return PortfolioWatchOnlyBtc.create(
        { source: WatchOnlySource.ADDRESS, address, networkType: PortfolioNetworkType.MAINNET },
        { name: 'w', icon: { type: 'emoji', value: '🐶' } }
    );
}

function readyAccount(accountId: string, portfolios: Portfolio[] = [portfolio()]) {
    return {
        accountId,
        state: {
            kind: 'ready' as const,
            portfolios,
            settings: NotificationSettings.fromStored(undefined)
        }
    };
}

function pendingAccount(accountId: string) {
    return { accountId, state: { kind: 'pending' as const } };
}

function createHarness() {
    const storage = new InMemoryTreeStorage(['ux']);
    const api = {
        replaceGroup: vi.fn<NotificationsApi['replaceGroup']>(async () => ({})),
        deleteGroup: vi.fn<NotificationsApi['deleteGroup']>(async () => undefined),
        deleteDevice: vi.fn<NotificationsApi['deleteDevice']>(async () => undefined)
    };
    const pushNotifications: IPushNotifications = {
        getPermissionStatus: async () => 'granted',
        requestPermission: async () => 'granted',
        getPushToken: async () => 'ExponentPushToken[test]',
        openSystemSettings: () => undefined
    };
    const logger = {
        info: vi.fn(),
        debug: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        child: vi.fn()
    } as unknown as Logger;

    const syncer = new PushSubscriptionSyncer({
        api: api as unknown as NotificationsApi,
        pushNotifications,
        platform: 'ios',
        storage,
        logger
    });

    const stored = (key: string) => storage.child('push-subscription').getItem(key);

    return { syncer, api, storage, stored };
}

const active = (accounts: PushSyncInput['accounts']): PushSyncInput => ({
    isPushActive: true,
    accounts
});

describe('PushSubscriptionSyncer', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('registers a group for a ready account and reuses its id on the next sync', async () => {
        const { syncer, api, stored } = createHarness();

        await syncer.sync(active([readyAccount('a')]));

        expect(api.replaceGroup).toHaveBeenCalledTimes(1);
        const [deviceId, groupId] = api.replaceGroup.mock.calls[0]!;
        expect(await stored('deviceId')).toBe(JSON.stringify(deviceId));
        expect(await stored('groupIds')).toBe(JSON.stringify({ a: groupId }));

        await syncer.sync(active([readyAccount('a')]));
        expect(api.replaceGroup).toHaveBeenCalledTimes(1);
    });

    it('never deletes groups of accounts that are still hydrating', async () => {
        const { syncer, api } = createHarness();

        await syncer.sync(active([readyAccount('a'), readyAccount('b')]));
        await syncer.sync(active([pendingAccount('a'), readyAccount('b')]));

        expect(api.deleteGroup).not.toHaveBeenCalled();
        expect(api.replaceGroup).toHaveBeenCalledTimes(2);
    });

    it('deletes groups of removed accounts and of accounts with nothing to subscribe', async () => {
        const { syncer, api, stored } = createHarness();

        await syncer.sync(active([readyAccount('a'), readyAccount('b')]));
        await syncer.sync(active([readyAccount('b', [])]));

        expect(api.deleteGroup).toHaveBeenCalledTimes(2);
        expect(await stored('groupIds')).toBe(JSON.stringify({}));
    });

    it('keeps the reserved group id and retries once after a failed PUT', async () => {
        const { syncer, api, stored } = createHarness();
        api.replaceGroup.mockRejectedValueOnce(new Error('offline'));

        await syncer.sync(active([readyAccount('a')]));

        expect(api.replaceGroup).toHaveBeenCalledTimes(1);
        const groupIds = JSON.parse((await stored('groupIds')) ?? '{}') as Record<string, string>;
        expect(Object.keys(groupIds)).toEqual(['a']);

        await vi.advanceTimersByTimeAsync(30_000);

        expect(api.replaceGroup).toHaveBeenCalledTimes(2);
        expect(api.replaceGroup.mock.calls[1]?.[1]).toBe(groupIds.a);
    });

    it('coalesces syncs that arrive during a run into one extra run with the latest input', async () => {
        const { syncer, api } = createHarness();
        let release: (value: Record<string, string>) => void = () => undefined;
        const blocked = new Promise<Record<string, string>>(resolve => {
            release = resolve;
        });
        api.replaceGroup.mockImplementationOnce(() => blocked);

        const first = syncer.sync(active([readyAccount('a')]));
        void syncer.sync(active([readyAccount('a'), readyAccount('b')]));
        void syncer.sync(active([readyAccount('a'), readyAccount('c')]));
        await vi.advanceTimersByTimeAsync(0);
        release({});
        await first;

        const putAccounts = api.replaceGroup.mock.calls.map(
            call => (call as unknown as [string, string, { events: { targets: string[] }[] }])[2]
        );
        expect(putAccounts).toHaveLength(2);
        expect(api.deleteGroup).not.toHaveBeenCalled();
    });

    it('reset deletes the device and forgets local state; no requests when nothing is registered', async () => {
        const { syncer, api, stored } = createHarness();

        await syncer.reset();
        expect(api.deleteDevice).not.toHaveBeenCalled();

        await syncer.sync(active([readyAccount('a')]));
        await syncer.sync({ isPushActive: false, accounts: [] });

        expect(api.deleteDevice).toHaveBeenCalledTimes(1);
        expect(await stored('deviceId')).toBeNull();
        expect(await stored('groupIds')).toBeNull();
    });
});
