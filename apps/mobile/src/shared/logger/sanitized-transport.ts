import { filterSensitiveData } from '@safely/core';
import type { ILoggerTransport, LogEntry, LoggerLifecycleContext } from '@safely/sync';

export class SanitizedTransport implements ILoggerTransport {
    constructor(private readonly inner: ILoggerTransport) {}

    public log(entry: LogEntry): void {
        this.inner.log({
            ...entry,
            message: entry.message.map(filterSensitiveValue)
        });
    }

    public async onAfterAppOpened(ctx: LoggerLifecycleContext): Promise<void> {
        await this.inner.onAfterAppOpened?.(ctx);
    }

    public async onBeforeAppClosed(ctx: LoggerLifecycleContext): Promise<void> {
        await this.inner.onBeforeAppClosed?.(ctx);
    }
}

function filterSensitiveValue(value: unknown): unknown {
    if (typeof value === 'string') return filterSensitiveData(value);

    if (value instanceof Error) {
        const filtered = new Error(filterSensitiveData(value.message));

        if (value.stack) {
            filtered.stack = filterSensitiveData(value.stack);
        }

        return filtered;
    }

    if (typeof value === 'object' && value !== null) {
        try {
            const json = JSON.stringify(value);
            const sanitized = filterSensitiveData(json);

            return JSON.parse(sanitized);
        } catch {
            return '[Object: sanitization failed]';
        }
    }

    return value;
}
