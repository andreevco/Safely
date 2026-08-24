import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useAppContext, useCountdownToTimestamp, useSuspenseQuery } from '@safely/ux';

import { lockoutKeys } from './keys';
import type { LockoutState } from './lockout';
import { getLockoutDuration, sLockoutState } from './lockout';

const LOCKOUT_KEY = 'passcodeLockout';

const EMPTY: LockoutState = { failedAttempts: 0, lockedUntil: null };

export function usePasscodeLockout() {
    const client = useQueryClient();
    const { storage } = useAppContext();

    const { data } = useSuspenseQuery({
        queryKey: lockoutKeys.state.toKey(),
        async queryFn(): Promise<LockoutState> {
            const stored = await storage.ux.regular.getItem(LOCKOUT_KEY);
            const parsed = sLockoutState.safeParse(stored === null ? null : JSON.parse(stored));

            return parsed.success ? parsed.data : EMPTY;
        }
    });

    const remainingSeconds = useCountdownToTimestamp(data.lockedUntil);

    const persist = useCallback(
        async (next: LockoutState) => {
            await storage.ux.regular.setItem(LOCKOUT_KEY, JSON.stringify(next));
            await client.invalidateQueries({ queryKey: lockoutKeys.state.toKey() });
        },
        [storage, client]
    );

    const recordFailure = useCallback(async () => {
        const failedAttempts = data.failedAttempts + 1;
        const duration = getLockoutDuration(failedAttempts);

        await persist({
            failedAttempts,
            lockedUntil: duration === null ? null : Date.now() + duration
        });
    }, [data.failedAttempts, persist]);

    const reset = useCallback(() => persist(EMPTY), [persist]);

    return {
        isLocked: remainingSeconds > 0,
        remainingSeconds,
        recordFailure,
        reset
    };
}
