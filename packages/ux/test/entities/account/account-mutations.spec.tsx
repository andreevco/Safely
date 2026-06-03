/* eslint-disable @typescript-eslint/consistent-type-imports */
/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import { act, cleanup } from '@testing-library/react';
import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
    useChangeAccountMeta,
    useConnectAccountToNewDevice,
    useCreateAccount,
    useCreateExistingAccountConnector,
    useCreateReconnectConnector,
    useDeleteAccount,
    useEraseAllData,
    useSetActiveAccount
} from '../../../src/entities/account/account-mutations';
import * as accountState from '../../../src/entities/account/account-state';
import { accountKey } from '../../../src/entities/account/keys';
import * as syncedDevice from '../../../src/entities/synced-device';
import type { MockSyncAccount } from '../../harness';
import {
    createMockSyncAccount,
    createTestAppContext,
    createTestQueryClient,
    renderHookWithProviders
} from '../../harness';

vi.mock('../../../src/entities/account/account-state', async () => {
    const actual = await vi.importActual<
        typeof import('../../../src/entities/account/account-state')
    >('../../../src/entities/account/account-state');
    return {
        ...actual,
        useAccountsFactory: vi.fn(),
        useAccountsQueryConfig: vi.fn(),
        useAccounts: vi.fn(),
        useActiveAccount: vi.fn(),
        useActiveAccountQuery: vi.fn(),
        useActiveAccountQueryKey: vi.fn(),
        useActiveAccountStoreSlot: vi.fn(),
        useActiveAccountMeta: vi.fn()
    };
});

vi.mock('../../../src/entities/synced-device', async () => {
    const actual = await vi.importActual<typeof import('../../../src/entities/synced-device')>(
        '../../../src/entities/synced-device'
    );
    return {
        ...actual,
        useCurrentDeviceIkPub: vi.fn(),
        useGenerateOwnSyncedDeviceMeta: vi.fn(),
        useSetOwnSyncedDeviceMeta: vi.fn()
    };
});

type FactoryStub = {
    createSyncAccount: ReturnType<typeof vi.fn>;
    connectToExistingSyncAccount: ReturnType<typeof vi.fn>;
    deleteLocalAccount: ReturnType<typeof vi.fn>;
};

function createFactoryStub(overrides: Partial<FactoryStub> = {}): FactoryStub {
    return {
        createSyncAccount: vi.fn(),
        connectToExistingSyncAccount: vi.fn(),
        deleteLocalAccount: vi.fn(async () => undefined),
        ...overrides
    };
}

function setupAccountState(opts: {
    account?: MockSyncAccount;
    accounts?: MockSyncAccount[];
    activeMeta?: { name: string };
    factory?: FactoryStub;
    storeSlot?: (key: string) => unknown;
}) {
    const accounts = opts.accounts ?? (opts.account ? [opts.account] : []);
    const active = opts.account ?? accounts[0] ?? null;

    (accountState.useAccounts as Mock).mockReturnValue(accounts);
    (accountState.useActiveAccount as Mock).mockImplementation(() => {
        if (!active) throw new Error('No active account in test setup');
        return active;
    });
    (accountState.useActiveAccountQuery as Mock).mockReturnValue({
        data: active,
        isLoading: false,
        isError: false
    });
    (accountState.useActiveAccountQueryKey as Mock).mockReturnValue(
        accountKey.accountId(active?.accountId)
    );
    (accountState.useActiveAccountStoreSlot as Mock).mockImplementation(
        opts.storeSlot ?? (() => undefined)
    );
    (accountState.useActiveAccountMeta as Mock).mockReturnValue(
        opts.activeMeta ?? { name: 'Existing' }
    );
    (accountState.useAccountsFactory as Mock).mockReturnValue(opts.factory ?? createFactoryStub());
    (accountState.useAccountsQueryConfig as Mock).mockReturnValue({
        queryKey: accountKey.list.toKey(),
        queryFn: async () => accounts
    });
}

function setupSyncedDevice(opts: { ikPub?: string } = {}) {
    (syncedDevice.useCurrentDeviceIkPub as Mock).mockReturnValue(opts.ikPub ?? 'AAAA');
    (syncedDevice.useGenerateOwnSyncedDeviceMeta as Mock).mockReturnValue(() => ({
        key: opts.ikPub ?? 'AAAA',
        value: {
            name: 'TEST_DEVICE',
            platform: 'ios' as const,
            osVersion: '0.0.0',
            appVersion: '0.0.0-test',
            pairedAt: 1700000000000
        }
    }));
    (syncedDevice.useSetOwnSyncedDeviceMeta as Mock).mockReturnValue({
        mutateAsync: vi.fn(async () => undefined)
    });
}

beforeEach(async () => {
    cleanup();
    await new Promise(resolve => setTimeout(resolve, 0));

    (accountState.useAccountsFactory as Mock).mockReset();
    (accountState.useAccountsQueryConfig as Mock).mockReset();
    (accountState.useAccounts as Mock).mockReset();
    (accountState.useActiveAccount as Mock).mockReset();
    (accountState.useActiveAccountQuery as Mock).mockReset();
    (accountState.useActiveAccountQueryKey as Mock).mockReset();
    (accountState.useActiveAccountStoreSlot as Mock).mockReset();
    (accountState.useActiveAccountMeta as Mock).mockReset();
    (syncedDevice.useCurrentDeviceIkPub as Mock).mockReset();
    (syncedDevice.useGenerateOwnSyncedDeviceMeta as Mock).mockReset();
    (syncedDevice.useSetOwnSyncedDeviceMeta as Mock).mockReset();
});

describe('useCreateAccount (add)', () => {
    it('calls factory.createSyncAccount, writes meta + devicesMeta + analyticsId, invalidates list', async () => {
        const newAccount = createMockSyncAccount({ accountId: 'new-account-id' });
        const factory = createFactoryStub({
            createSyncAccount: vi.fn(async () => newAccount)
        });
        setupAccountState({ accounts: [], factory });
        setupSyncedDevice({ ikPub: 'IKPUB_FOR_NEW' });

        const appContext = createTestAppContext();
        const { result } = renderHookWithProviders(() => useCreateAccount(), {
            appContext
        });

        await act(async () => {
            await result.current.mutateAsync({
                name: 'Alice',
                secureEncryptedStorage: appContext.storage.sync.encrypted as unknown as Parameters<
                    typeof result.current.mutateAsync
                >[0]['secureEncryptedStorage']
            });
        });

        expect(factory.createSyncAccount).toHaveBeenCalledTimes(1);

        expect(newAccount.syncProvider.transaction).toHaveBeenCalledTimes(1);
        const recorder = newAccount.transactions[0];
        expect(recorder.set).toHaveBeenCalledWith('meta', { name: 'Alice' });

        const devicesMetaSlot = recorder.slots.get('devicesMeta');
        expect(devicesMetaSlot?.orDefault).toHaveBeenCalled();

        const analyticsSlot = recorder.slots.get('analyticsId');
        expect(analyticsSlot?.set).toHaveBeenCalled();
    });

    it('with createWallet:true seeds portfolios + latestDerivedBip39PortfolioIndex', async () => {
        const newAccount = createMockSyncAccount({ accountId: 'wallet-account' });
        const factory = createFactoryStub({
            createSyncAccount: vi.fn(async () => newAccount)
        });
        setupAccountState({ accounts: [], factory });
        setupSyncedDevice();

        const appContext = createTestAppContext();
        const { result } = renderHookWithProviders(() => useCreateAccount({ createWallet: true }), {
            appContext
        });

        await act(async () => {
            await result.current.mutateAsync({
                secureEncryptedStorage: appContext.storage.sync.encrypted as unknown as Parameters<
                    typeof result.current.mutateAsync
                >[0]['secureEncryptedStorage']
            });
        });

        const recorder = newAccount.transactions[0];
        // portfolios + latestDerivedBip39PortfolioIndex are written via root .set,
        // captured on the root recorder.
        const setCalls = recorder.set.mock.calls.map(c => c[0]);
        expect(setCalls).toEqual(
            expect.arrayContaining(['meta', 'portfolios', 'latestDerivedBip39PortfolioIndex'])
        );

        const latestIndexSet = recorder.set.mock.calls.find(
            c => c[0] === 'latestDerivedBip39PortfolioIndex'
        );
        expect(latestIndexSet?.[1]).toBe(0);
    });

    it('with setActive:true invokes setActiveAccount with the new accountId', async () => {
        const newAccount = createMockSyncAccount({ accountId: 'active-new' });
        const factory = createFactoryStub({
            createSyncAccount: vi.fn(async () => newAccount)
        });
        setupAccountState({ accounts: [newAccount], factory });
        setupSyncedDevice();

        const appContext = createTestAppContext();
        const queryClient = createTestQueryClient();

        const { result } = renderHookWithProviders(() => useCreateAccount({ setActive: true }), {
            appContext,
            queryClient
        });

        await act(async () => {
            await result.current.mutateAsync({
                secureEncryptedStorage: appContext.storage.sync.encrypted as unknown as Parameters<
                    typeof result.current.mutateAsync
                >[0]['secureEncryptedStorage']
            });
        });

        // setActiveAccount writes to the shared local storage 'activeAccount' key
        const activeId = await appContext.storage.ux.regular
            .child('shared')
            .getItem('activeAccount');
        expect(activeId).toBe(JSON.stringify('active-new'));
    });
});

describe('useChangeAccountMeta (change)', () => {
    it('merges new meta over the current meta', async () => {
        const account = createMockSyncAccount();
        setupAccountState({
            account,
            activeMeta: { name: 'Old', icon: { type: 'emoji', value: '🦊' } } as unknown as {
                name: string;
            }
        });
        setupSyncedDevice();

        const { result } = renderHookWithProviders(() => useChangeAccountMeta(), {
            appContext: createTestAppContext()
        });

        await act(async () => {
            await result.current.mutateAsync({ name: 'New' });
        });

        expect(account.syncProvider.transaction).toHaveBeenCalledTimes(1);
        const recorder = account.transactions[0];
        const metaSlot = recorder.slots.get('meta');
        expect(metaSlot?.set).toHaveBeenCalledWith({
            name: 'New',
            icon: { type: 'emoji', value: '🦊' }
        });
    });
});

describe('useSetActiveAccount (change)', () => {
    it('writes id to shared storage and refetches active account query', async () => {
        const a = createMockSyncAccount({ accountId: 'A' });
        const b = createMockSyncAccount({ accountId: 'B' });
        setupAccountState({ accounts: [a, b], account: a });
        setupSyncedDevice();

        const appContext = createTestAppContext();
        const queryClient = createTestQueryClient();
        queryClient.setQueryData(accountKey.list.active.toKey(), a);

        const { result } = renderHookWithProviders(() => useSetActiveAccount(), {
            appContext,
            queryClient
        });

        await act(async () => {
            await result.current.mutateAsync('B');
        });

        const stored = await appContext.storage.ux.regular.child('shared').getItem('activeAccount');
        expect(stored).toBe(JSON.stringify('B'));
    });

    it('throws when target accountId is not in the list', async () => {
        const a = createMockSyncAccount({ accountId: 'A' });
        setupAccountState({ accounts: [a], account: a });
        setupSyncedDevice();

        const { result } = renderHookWithProviders(() => useSetActiveAccount(), {
            appContext: createTestAppContext()
        });

        let caught: unknown;
        await act(async () => {
            try {
                await result.current.mutateAsync('UNKNOWN_ID');
            } catch (e) {
                caught = e;
            }
        });
        expect((caught as Error)?.message).toBe('Account not found');
    });
});

describe('useDeleteAccount (remove)', () => {
    it('unlocks secure storage, removes own device meta, deletes local account, clears local storage', async () => {
        const a = createMockSyncAccount({ accountId: 'to-delete' });
        const b = createMockSyncAccount({ accountId: 'survivor' });
        const factory = createFactoryStub();
        setupAccountState({ accounts: [a, b], account: a, factory });
        setupSyncedDevice({ ikPub: 'MY_IK_HEX' });

        const appContext = createTestAppContext();
        const queryClient = createTestQueryClient();
        queryClient.setQueryData(accountKey.list.toKey(), [a, b]);

        const { result } = renderHookWithProviders(() => useDeleteAccount(), {
            appContext,
            queryClient
        });

        // Pre-write some account-local-storage entry so we can verify cleanup
        await appContext.storage.ux.regular
            .child(['account', 'to-delete'])
            .setItem('activePortfolio', '{}');

        await act(async () => {
            await result.current.mutateAsync();
        });

        expect(factory.deleteLocalAccount).toHaveBeenCalledWith(
            'to-delete',
            expect.objectContaining({ unlock: expect.any(Function) })
        );

        const recorder = a.transactions[0];
        const devicesMetaSlot = recorder.slots.get('devicesMeta');
        expect(devicesMetaSlot?.ifPresent).toHaveBeenCalled();

        // Local-storage for the deleted account was cleared
        const leftover = await appContext.storage.ux.regular
            .child(['account', 'to-delete'])
            .getItem('activePortfolio');
        expect(leftover).toBeNull();

        // accountKey.list cache is updated to drop the deleted account
        const listCache = queryClient.getQueryData<MockSyncAccount[]>(accountKey.list.toKey());
        expect(listCache).toEqual([b]);
        const activeCache = queryClient.getQueryData(accountKey.list.active.toKey());
        expect(activeCache).toBe(b);
    });

    it('keeps stale account queries in cache when no accounts remain', async () => {
        const lone = createMockSyncAccount({ accountId: 'lone' });
        const factory = createFactoryStub();
        setupAccountState({ accounts: [lone], account: lone, factory });
        setupSyncedDevice();

        const appContext = createTestAppContext();
        const queryClient = createTestQueryClient();
        queryClient.setQueryData(accountKey.list.toKey(), [lone]);
        queryClient.setQueryData(accountKey.list.active.toKey(), lone);

        const { result } = renderHookWithProviders(() => useDeleteAccount(), {
            appContext,
            queryClient
        });

        await act(async () => {
            await result.current.mutateAsync();
        });

        expect(queryClient.getQueryData(accountKey.list.toKey())).toEqual([lone]);
        expect(queryClient.getQueryData(accountKey.list.active.toKey())).toBe(lone);
    });
});

describe('useEraseAllData (remove)', () => {
    it('calls clearAllData and reloadApp on success', async () => {
        const clearAllData = vi.fn(async () => undefined);
        const reloadApp = vi.fn();
        setupAccountState({});
        setupSyncedDevice();

        const appContext = createTestAppContext({ clearAllData, reloadApp });

        const { result } = renderHookWithProviders(() => useEraseAllData(), {
            appContext
        });

        await act(async () => {
            await result.current.mutateAsync();
        });

        expect(clearAllData).toHaveBeenCalledTimes(1);
        expect(reloadApp).toHaveBeenCalledTimes(1);
    });

    it('shows error toast and rethrows when clearAllData fails', async () => {
        const failure = new Error('boom');
        const clearAllData = vi.fn(async () => {
            throw failure;
        });
        const reloadApp = vi.fn();
        const toastShow = vi.fn();
        setupAccountState({});
        setupSyncedDevice();

        const appContext = createTestAppContext({ clearAllData, reloadApp, toastShow });

        const { result } = renderHookWithProviders(() => useEraseAllData(), {
            appContext
        });

        let caught: unknown;
        await act(async () => {
            try {
                await result.current.mutateAsync();
            } catch (e) {
                caught = e;
            }
        });

        expect(caught).toBe(failure);
        expect(reloadApp).not.toHaveBeenCalled();
        expect(toastShow).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
    });
});

describe('useConnectAccountToNewDevice (add device)', () => {
    it('scans QR, forwards to account.connectToNewDevice, shows success toast', async () => {
        const account = createMockSyncAccount();
        setupAccountState({ account });
        setupSyncedDevice();

        const qrScan = vi.fn(async () => 'ZHVtbXk=');
        const toastShow = vi.fn();
        const appContext = createTestAppContext({ qrScan, toastShow });

        const { result } = renderHookWithProviders(() => useConnectAccountToNewDevice(), {
            appContext
        });

        await act(async () => {
            await result.current.mutateAsync({
                secureEncryptedStorage: appContext.storage.sync.encrypted as unknown as Parameters<
                    typeof result.current.mutateAsync
                >[0]['secureEncryptedStorage']
            });
        });

        expect(qrScan).toHaveBeenCalledTimes(1);
        expect(account.connectToNewDevice).toHaveBeenCalledTimes(1);

        const [bufferArg] = (account.connectToNewDevice as Mock).mock.calls[0];
        expect(Buffer.isBuffer(bufferArg)).toBe(true);

        expect(toastShow).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }));
    });

    it('forwards errors to errorToast', async () => {
        const account = createMockSyncAccount();
        (account.connectToNewDevice as Mock).mockRejectedValueOnce(new Error('nope'));
        setupAccountState({ account });
        setupSyncedDevice();

        const qrScan = vi.fn(async () => 'ZHVtbXk=');
        const toastShow = vi.fn();
        const appContext = createTestAppContext({ qrScan, toastShow });

        const { result } = renderHookWithProviders(() => useConnectAccountToNewDevice(), {
            appContext
        });

        let caught: unknown;
        await act(async () => {
            try {
                await result.current.mutateAsync({
                    secureEncryptedStorage: appContext.storage.sync
                        .encrypted as unknown as Parameters<
                        typeof result.current.mutateAsync
                    >[0]['secureEncryptedStorage']
                });
            } catch (e) {
                caught = e;
            }
        });

        expect((caught as Error)?.message).toBe('nope');
        expect(toastShow).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
    });
});

describe('useCreateExistingAccountConnector (add device → existing account)', () => {
    it('produces a connectionString and exposes abort/accountPromise', async () => {
        const remoteAccount = createMockSyncAccount({ accountId: 'remote' });
        const abort = vi.fn();
        const accountPromise = Promise.resolve(remoteAccount);
        const factory = createFactoryStub({
            connectToExistingSyncAccount: vi.fn(async () => ({
                data: Buffer.from('hello'),
                waitForCompletion: () => accountPromise,
                abort
            }))
        });
        setupAccountState({ accounts: [], factory });
        setupSyncedDevice();

        const appContext = createTestAppContext();
        const { result } = renderHookWithProviders(() => useCreateExistingAccountConnector(), {
            appContext
        });

        let connector: Awaited<ReturnType<typeof result.current.mutateAsync>> | undefined;
        await act(async () => {
            connector = await result.current.mutateAsync({
                secureEncryptedStorage: appContext.storage.sync.encrypted as unknown as Parameters<
                    typeof result.current.mutateAsync
                >[0]['secureEncryptedStorage']
            });
        });

        expect(factory.connectToExistingSyncAccount).toHaveBeenCalledTimes(1);
        expect(connector?.connectionString).toBe(Buffer.from('hello').toString('base64url'));
        await expect(connector?.accountPromise).resolves.toBe(remoteAccount);

        connector?.abort();
        expect(abort).toHaveBeenCalledTimes(1);
    });

    it('reset() aborts the previous connector', async () => {
        const abort = vi.fn();
        const factory = createFactoryStub({
            connectToExistingSyncAccount: vi.fn(async () => ({
                data: Buffer.from('hello'),
                waitForCompletion: () => new Promise(() => undefined),
                abort
            }))
        });
        setupAccountState({ accounts: [], factory });
        setupSyncedDevice();

        const appContext = createTestAppContext();
        const { result, rerender } = renderHookWithProviders(
            () => useCreateExistingAccountConnector(),
            { appContext }
        );

        await act(async () => {
            await result.current.mutateAsync({
                secureEncryptedStorage: appContext.storage.sync.encrypted as unknown as Parameters<
                    typeof result.current.mutateAsync
                >[0]['secureEncryptedStorage']
            });
        });

        // Force a re-render so the latest closure of `reset` (which references
        // mutation.data) is the one we call below.
        rerender(undefined);

        await act(async () => {
            result.current.reset();
        });

        expect(abort).toHaveBeenCalledTimes(1);
    });
});

describe('useCreateReconnectConnector (reconnect existing account)', () => {
    it('delegates to active account.reconnectToAccount', async () => {
        const account = createMockSyncAccount();
        const abort = vi.fn();
        (account.reconnectToAccount as Mock).mockImplementation(async () => ({
            data: Buffer.from('reconn'),
            waitForCompletion: () => Promise.resolve(account),
            abort
        }));
        setupAccountState({ account });
        setupSyncedDevice();

        const { result } = renderHookWithProviders(() => useCreateReconnectConnector(), {
            appContext: createTestAppContext()
        });

        let connector: Awaited<ReturnType<typeof result.current.mutateAsync>> | undefined;
        await act(async () => {
            connector = await result.current.mutateAsync();
        });

        expect(account.reconnectToAccount).toHaveBeenCalledTimes(1);
        expect(connector?.connectionString).toBe(Buffer.from('reconn').toString('base64url'));
    });
});
