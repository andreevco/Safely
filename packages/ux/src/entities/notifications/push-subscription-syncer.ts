import { v4 as uuid4 } from 'uuid';
import type z from 'zod';

import type {
    Build,
    IPushNotifications,
    ITreeStorage,
    NotificationSettings,
    NotificationsApi,
    Portfolio,
    PushDeviceCredentials,
    SubscriptionGroup
} from '@safely/core';
import { buildSubscriptionGroup } from '@safely/core';
import type { Logger } from '@safely/sync';

import type { PushSubscriptionStorageStructure } from './storage';
import { pushSubscriptionStorageStructure } from './storage';

const RETRY_DELAY_MS = 30_000;

export type AccountSubscriptionState =
    | { kind: 'ready'; portfolios: Portfolio[]; settings: NotificationSettings }
    | { kind: 'pending' };

export type PushSyncInput = {
    isPushActive: boolean;
    isNewsEnabled: boolean;
    lang: string;
    accounts: { accountId: string; state: AccountSubscriptionState }[];
};

type PushSubscriptionSyncerDeps = {
    api: NotificationsApi;
    pushNotifications: IPushNotifications;
    platform: Build;
    appVersion: string;
    storage: ITreeStorage;
    logger: Logger;
};

type StorageKey = keyof PushSubscriptionStorageStructure;
type StoredValue<K extends StorageKey> = z.output<PushSubscriptionStorageStructure[K]>;

type DesiredGroup = SubscriptionGroup | 'pending' | null;

const RESET_INPUT: PushSyncInput = {
    isPushActive: false,
    isNewsEnabled: false,
    lang: '',
    accounts: []
};

const GENERAL_KEY = 'general';

export class PushSubscriptionSyncer {
    private readonly storage: ITreeStorage;

    private readonly lastSent = new Map<string, string>();

    private running: Promise<void> | null = null;

    private pending: PushSyncInput | null = null;

    private retryTimer: ReturnType<typeof setTimeout> | null = null;

    constructor(private readonly deps: PushSubscriptionSyncerDeps) {
        this.storage = deps.storage.child('push-subscription');
    }

    public sync(input: PushSyncInput): Promise<void> {
        this.cancelRetry();
        this.pending = input;
        this.running ??= this.drain();

        return this.running;
    }

    public reset(): Promise<void> {
        return this.sync(RESET_INPUT);
    }

    public dispose(): void {
        this.cancelRetry();
    }

    private async drain(): Promise<void> {
        try {
            while (this.pending) {
                const input = this.pending;
                this.pending = null;

                const failures = await this.runOnce(input);
                if (failures > 0 && !this.pending) this.scheduleRetry(input);
            }
        } finally {
            this.running = null;
        }
    }

    private async runOnce(input: PushSyncInput): Promise<number> {
        if (!input.isPushActive) {
            return this.attempt('reset', () => this.resetDevice());
        }

        const groupIds = await this.readGroupIds();
        if (groupIds === null) {
            return this.attempt('reset', () => this.resetDevice());
        }

        const deviceId = await this.resolveDeviceId();
        const pushToken = await this.resolvePushToken();
        if (pushToken === null) return 1;

        const credentials: PushDeviceCredentials = {
            pushToken,
            platform: this.deps.platform,
            lang: input.lang,
            appVersion: this.deps.appVersion
        };
        const desired = new Map<string, DesiredGroup>(
            input.accounts.map(({ accountId, state }) => [
                accountId,
                state.kind === 'pending'
                    ? 'pending'
                    : buildSubscriptionGroup(state.settings, state.portfolios)
            ])
        );

        let failures = 0;

        for (const accountId of Object.keys(groupIds)) {
            if (desired.get(accountId)) continue;
            failures += await this.attempt('delete_group', () =>
                this.deleteGroup(deviceId, accountId)
            );
        }

        for (const [accountId, group] of desired) {
            if (group === 'pending' || group === null) continue;

            const signature = JSON.stringify({ credentials, group });
            if (this.lastSent.get(accountId) === signature) continue;

            failures += await this.attempt('replace_group', () =>
                this.replaceGroup(deviceId, accountId, group, credentials, signature)
            );
        }

        const generalSignature = JSON.stringify({ credentials, news: input.isNewsEnabled });
        if (this.lastSent.get(GENERAL_KEY) !== generalSignature) {
            failures += await this.attempt('replace_general', () =>
                this.replaceGeneral(deviceId, input.isNewsEnabled, credentials, generalSignature)
            );
        }

        return failures;
    }

    private async replaceGeneral(
        deviceId: string,
        isNewsEnabled: boolean,
        credentials: PushDeviceCredentials,
        signature: string
    ): Promise<void> {
        this.deps.logger.info('push_subscription.replace_general', { isNewsEnabled });
        if (isNewsEnabled) {
            await this.deps.api.replaceGeneral(deviceId, { news: true }, credentials);
        } else {
            await this.deps.api.deleteGeneral(deviceId);
        }
        this.lastSent.set(GENERAL_KEY, signature);
    }

    private async replaceGroup(
        deviceId: string,
        accountId: string,
        group: SubscriptionGroup,
        credentials: PushDeviceCredentials,
        signature: string
    ): Promise<void> {
        const groupId = await this.reserveGroupId(accountId);
        this.deps.logger.info('push_subscription.replace_group', { accountId, groupId });
        await this.deps.api.replaceGroup(deviceId, groupId, group, credentials);
        this.lastSent.set(accountId, signature);
    }

    private async deleteGroup(deviceId: string, accountId: string): Promise<void> {
        const groupIds = (await this.readGroupIds()) ?? {};
        const { [accountId]: groupId, ...rest } = groupIds;
        if (!groupId) return;

        this.deps.logger.info('push_subscription.delete_group', { accountId, groupId });
        await this.deps.api.deleteGroup(deviceId, groupId);
        await this.write('groupIds', rest);
        this.lastSent.delete(accountId);
    }

    private async resetDevice(): Promise<void> {
        const deviceId = await this.read('deviceId');
        if (!deviceId) return;

        try {
            this.deps.logger.info('push_subscription.delete_device', { deviceId });
            await this.deps.api.deleteDevice(deviceId);
            await this.storage.removeItem('groupIds');
            await this.storage.removeItem('deviceId');
        } finally {
            this.lastSent.clear();
        }
    }

    private async reserveGroupId(accountId: string): Promise<string> {
        const groupIds = (await this.readGroupIds()) ?? {};
        const existing = groupIds[accountId];
        if (existing) return existing;

        const groupId = uuid4();
        await this.write('groupIds', { ...groupIds, [accountId]: groupId });

        return groupId;
    }

    private async resolvePushToken(): Promise<string | null> {
        try {
            return await this.deps.pushNotifications.getPushToken();
        } catch (e) {
            this.deps.logger.error('push_subscription.push_token_failed', e);

            return null;
        }
    }

    private async resolveDeviceId(): Promise<string> {
        const stored = await this.read('deviceId');
        if (stored) return stored;

        const deviceId = uuid4();
        await this.write('deviceId', deviceId);

        return deviceId;
    }

    private async readGroupIds(): Promise<Record<string, string> | null> {
        try {
            return (await this.read('groupIds')) ?? {};
        } catch (e) {
            this.deps.logger.error('push_subscription.group_ids_corrupted', e);

            return null;
        }
    }

    private async attempt(operation: string, run: () => Promise<void>): Promise<number> {
        try {
            await run();

            return 0;
        } catch (e) {
            this.deps.logger.error(`push_subscription.${operation}_failed`, e);

            return 1;
        }
    }

    private scheduleRetry(input: PushSyncInput): void {
        this.retryTimer = setTimeout(() => {
            this.retryTimer = null;
            void this.sync(input);
        }, RETRY_DELAY_MS);
    }

    private cancelRetry(): void {
        if (this.retryTimer) clearTimeout(this.retryTimer);
        this.retryTimer = null;
    }

    private async read<K extends StorageKey>(key: K): Promise<StoredValue<K>> {
        const raw = await this.storage.getItem(key);
        const json: unknown = raw === null ? null : JSON.parse(raw);

        return pushSubscriptionStorageStructure[key].parse(json) as StoredValue<K>;
    }

    private write<K extends StorageKey>(key: K, value: StoredValue<K>): Promise<void> {
        return this.storage.setItem(key, JSON.stringify(value));
    }
}
