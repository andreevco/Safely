const INITIAL_RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 30_000;
const JITTER_RATIO = 0.2;

export function getReconnectDelayMs(attempt: number, random: () => number = Math.random): number {
    const exponent = Math.max(0, attempt - 1);
    const baseDelay = Math.min(MAX_RECONNECT_DELAY_MS, INITIAL_RECONNECT_DELAY_MS * 2 ** exponent);
    const jitterMultiplier = 1 - JITTER_RATIO + random() * JITTER_RATIO * 2;

    return Math.min(MAX_RECONNECT_DELAY_MS, Math.round(baseDelay * jitterMultiplier));
}
