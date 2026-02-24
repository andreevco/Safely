import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useCountdown, useSharedUnstructuredKeychainStorage, useSuspenseQuery } from '@safely/ux';

import { lockoutKeys } from './keys';
import { getLockoutDuration, LockoutState, sLockoutState } from './lockout';

export function usePasscodeLockout() {
    const client = useQueryClient();
    const {
        get: storageGet,
        set: storageSet,
        remove: storageRemove
    } = useSharedUnstructuredKeychainStorage('passcode_lockout', sLockoutState);

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
    const initialSeconds = lockedUntil ? Math.ceil((lockedUntil - Date.now()) / 1000) : 0;
    const remainingSeconds = useCountdown(initialSeconds);

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
