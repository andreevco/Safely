import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { SyncAccount } from '../src/account/sync-account';
import type { SyncAccountRepository } from '../src/account/sync-account-repository';
import { Logger } from '../src/logger/logger';
import { ReconnectOnboarding } from '../src/onboarding/reconnect/reconnect-onboarding';
import type { ISecretEncryptor } from '../src/secret-encryptor';
import type { SyncContainer } from '../src/sync-container';
import type { ISyncProvider } from '../src/sync-provider/I-sync-provider';
import { SyncStatus, SyncStatusManager } from '../src/sync-provider/sync-status';

const structure = { value: z.string() };

describe('SyncAccount reconnect onboarding', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('returns the active reconnect connector for concurrent calls', async () => {
        const { account, container } = createDeletedAccount();

        const [first, second] = await Promise.all([
            account.reconnectToAccount(),
            account.reconnectToAccount()
        ]);

        expect(first).toBe(second);
        expect(container.ikService.getPub).toHaveBeenCalledTimes(1);
    });

    it('runs reconnect completion once and clears the active connector after success', async () => {
        const waitForOnboarding = vi
            .spyOn(ReconnectOnboarding.prototype, 'waitForOnboarding')
            .mockResolvedValue(undefined);
        const { account } = createDeletedAccount();

        const connector = await account.reconnectToAccount();
        expect(waitForOnboarding).toHaveBeenCalledTimes(1);

        const [firstResult, secondResult] = await Promise.all([
            connector.waitForCompletion(),
            connector.waitForCompletion()
        ]);

        expect(firstResult).toBe(account);
        expect(secondResult).toBe(account);
        expect(waitForOnboarding).toHaveBeenCalledTimes(1);

        const nextConnector = await account.reconnectToAccount();
        expect(nextConnector).not.toBe(connector);
    });

    it('clears the active reconnect connector after failure', async () => {
        vi.spyOn(ReconnectOnboarding.prototype, 'waitForOnboarding').mockRejectedValue(
            new Error('failed')
        );
        const { account } = createDeletedAccount();

        const connector = await account.reconnectToAccount();

        await expect(connector.waitForCompletion()).rejects.toThrow('failed');
        await expect(account.reconnectToAccount()).resolves.not.toBe(connector);
    });

    it('clears the active reconnect connector after abort', async () => {
        const { account } = createDeletedAccount();

        const connector = await account.reconnectToAccount();
        connector.abort();

        await expect(account.reconnectToAccount()).resolves.not.toBe(connector);
    });
});

function createDeletedAccount(): {
    account: SyncAccount<typeof structure>;
    container: SyncContainer & { ikService: { getPub: ReturnType<typeof vi.fn> } };
} {
    const syncProvider = {
        structure,
        syncStatusManager: new SyncStatusManager(SyncStatus.DEVICE_DELETED),
        get: vi.fn(),
        getAll: vi.fn(),
        set: vi.fn(),
        remove: vi.fn(),
        onChange: vi.fn(() => () => undefined),
        onError: vi.fn(() => () => undefined),
        dispose: vi.fn(),
        restart: vi.fn(),
        triggerSync: vi.fn()
    } as unknown as ISyncProvider<typeof structure>;
    const container = {
        ikService: { getPub: vi.fn().mockResolvedValue(Buffer.from('01', 'hex')) },
        logger: new Logger({ log: () => undefined }),
        secretEncryptor: {} as ISecretEncryptor
    } as unknown as SyncContainer & { ikService: { getPub: ReturnType<typeof vi.fn> } };

    return {
        account: new SyncAccount({
            accountId: 'account-id',
            structure,
            syncProvider,
            container,
            syncAccountRepository: {} as SyncAccountRepository,
            online: true
        }),
        container
    };
}
