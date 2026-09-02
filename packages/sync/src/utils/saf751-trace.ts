export type Saf751TraceFn = (step: string, data?: Record<string, unknown>) => void;

declare global {
    var __saf751Trace: Saf751TraceFn | undefined;
}

export function installSaf751Trace(fn: Saf751TraceFn): void {
    globalThis.__saf751Trace = fn;
}

export function saf751(step: string, data?: Record<string, unknown>): void {
    try {
        globalThis.__saf751Trace?.(step, data);
    } catch {
        /* empty */
    }
}

export function saf751Sync<T>(step: string, fn: () => T, data?: Record<string, unknown>): T {
    const startedAt = Date.now();
    saf751(`${step}:start`, data);
    try {
        const result = fn();
        saf751(`${step}:ok`, { ms: Date.now() - startedAt });
        return result;
    } catch (error) {
        saf751(`${step}:fail`, { ms: Date.now() - startedAt, error: String(error) });
        throw error;
    }
}

export async function saf751Async<T>(
    step: string,
    fn: () => Promise<T> | T,
    data?: Record<string, unknown>
): Promise<T> {
    const startedAt = Date.now();
    saf751(`${step}:start`, data);
    try {
        const result = await fn();
        saf751(`${step}:ok`, { ms: Date.now() - startedAt });
        return result;
    } catch (error) {
        saf751(`${step}:fail`, { ms: Date.now() - startedAt, error: String(error) });
        throw error;
    }
}
