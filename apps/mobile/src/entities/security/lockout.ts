import z from 'zod';

export const sLockoutState = z.object({
    failedAttempts: z.number(),
    lockedUntil: z.number().nullable()
});

export type LockoutState = z.infer<typeof sLockoutState>;

const LOCKOUT_DURATIONS: Record<number, number> = {
    4: 60_000,
    5: 5 * 60_000,
    6: 15 * 60_000,
    7: 60 * 60_000,
    8: 6 * 60 * 60_000
};

const MAX_LOCKOUT = 24 * 60 * 60_000;

export function getLockoutDuration(attempt: number): number | null {
    if (attempt < 4) return null;
    return LOCKOUT_DURATIONS[attempt] ?? MAX_LOCKOUT;
}
