import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import {
    useCountdownToTimestamp,
    useSharedUnstructuredKeychainStorage,
    useSuspenseQuery
} from '@safely/ux';

import { StorageKey } from '@mobile/shared/constants';

import { lockoutKeys } from './keys';
import { getLockoutDuration, LockoutState, sLockoutState } from './lockout';

export function usePasscodeLockout() {
    const client = useQueryClient();
    const {
        get: storageGet,
        set: storageSet,
        remove: storageRemove
    } = useSharedUnstructuredKeychainStorage(StorageKey.PASSCODE_LOCKOUT, sLockoutState);

    const { data } = useSuspenseQuery({
        queryKey: lockoutKeys.state.toKey(),
        async queryFn() {
            const state = await storageGet();

            return (
                state ?? {
                    failedAttempts: 0,
                    lockedUntil: null
                }
            );
        }
    });

    const lockedUntil = data.lockedUntil;
    const remainingSeconds = useCountdownToTimestamp(lockedUntil);

    const isLocked = remainingSeconds > 0;

    const recordFailedAttempt = useCallback(async () => {
        const current = await storageGet();
        const failedAttempts = (current?.failedAttempts ?? 0) + 1;
        const duration = getLockoutDuration(failedAttempts);

        const newState: LockoutState = {
            failedAttempts,
            lockedUntil: duration ? Date.now() + duration : null
        };

        await storageSet(newState);
        await client.invalidateQueries({
            queryKey: lockoutKeys.state.toKey()
        });
    }, [storageGet, storageSet, client]);

    const resetAttempts = useCallback(async () => {
        await storageRemove();
        await client.invalidateQueries({
            queryKey: lockoutKeys.state.toKey()
        });
    }, [storageRemove, client]);

    return {
        isLocked,
        remainingSeconds,
        recordFailedAttempt,
        resetAttempts
    };
}
