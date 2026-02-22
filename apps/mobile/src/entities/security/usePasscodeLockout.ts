import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';

import { useSharedUnstructuredKeychainStorage, useSuspenseQuery } from '@safely/ux';

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

    const [remainingMs, setRemainingMs] = useState(() => {
        if (lockedUntil) {
            const remaining = lockedUntil - Date.now();

            return remaining > 0 ? remaining : 0;
        }

        return 0;
    });

    useEffect(() => {
        if (!lockedUntil || lockedUntil <= Date.now()) {
            setRemainingMs(0);
            return;
        }

        setRemainingMs(lockedUntil - Date.now());

        const interval = setInterval(() => {
            const ms = lockedUntil - Date.now();

            if (ms <= 0) {
                setRemainingMs(0);
                clearInterval(interval);
            } else {
                setRemainingMs(ms);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [lockedUntil]);

    const isLocked = remainingMs > 0;

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
        remainingMs,
        recordFailedAttempt,
        resetAttempts
    };
}
