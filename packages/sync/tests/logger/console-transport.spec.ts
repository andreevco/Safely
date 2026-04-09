import { describe, it, expect, vi, afterEach } from 'vitest';

import { ConsoleTransport, LogEntry, LogLevel } from '../../src';

function makeEntry(overrides: Partial<LogEntry> = {}): LogEntry {
    return {
        timestamp: '2026-04-07T12:00:00.000Z',
        level: LogLevel.INFO,
        path: [],
        message: 'test message',
        ...overrides
    };
}

describe('ConsoleTransport', () => {
    const transport = new ConsoleTransport();

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    afterEach(() => {
        logSpy.mockClear();
        warnSpy.mockClear();
        errorSpy.mockClear();
    });

    describe('routing', () => {
        it('should route ERROR to console.error', () => {
            transport.log(makeEntry({ level: LogLevel.ERROR }));
            expect(errorSpy).toHaveBeenCalledOnce();
            expect(logSpy).not.toHaveBeenCalled();
            expect(warnSpy).not.toHaveBeenCalled();
        });

        it('should route WARN to console.warn', () => {
            transport.log(makeEntry({ level: LogLevel.WARN }));
            expect(warnSpy).toHaveBeenCalledOnce();
            expect(logSpy).not.toHaveBeenCalled();
            expect(errorSpy).not.toHaveBeenCalled();
        });

        it('should route TRACE to console.log', () => {
            transport.log(makeEntry({ level: LogLevel.TRACE }));
            expect(logSpy).toHaveBeenCalledOnce();
        });

        it('should route DEBUG to console.log', () => {
            transport.log(makeEntry({ level: LogLevel.DEBUG }));
            expect(logSpy).toHaveBeenCalledOnce();
        });

        it('should route INFO to console.log', () => {
            transport.log(makeEntry({ level: LogLevel.INFO }));
            expect(logSpy).toHaveBeenCalledOnce();
        });
    });

    describe('prefix formatting', () => {
        it('should pad level string to 5 chars', () => {
            transport.log(makeEntry({ level: LogLevel.INFO }));
            const prefix = logSpy.mock.calls[0][0] as string;
            expect(prefix).toContain('[ INFO]');
        });

        it('should not pad 5-char level names', () => {
            transport.log(makeEntry({ level: LogLevel.TRACE }));
            const prefix = logSpy.mock.calls[0][0] as string;
            expect(prefix).toContain('[TRACE]');
        });

        it('should include timestamp', () => {
            transport.log(makeEntry({ timestamp: '2026-01-15T10:30:00.000Z' }));
            const prefix = logSpy.mock.calls[0][0] as string;
            expect(prefix).toContain('[2026-01-15T10:30:00.000Z]');
        });

        it('should include app version when present', () => {
            transport.log(makeEntry({ appVersion: '1.0.1' }));
            const prefix = logSpy.mock.calls[0][0] as string;
            expect(prefix).toContain('[v1.0.1]');
        });

        it('should omit version when not present', () => {
            transport.log(makeEntry());
            const prefix = logSpy.mock.calls[0][0] as string;
            expect(prefix).not.toContain('[v');
        });

        it('should include path joined by >', () => {
            transport.log(makeEntry({ path: ['sync', 'account', 'ab12'] }));
            const prefix = logSpy.mock.calls[0][0] as string;
            expect(prefix).toContain('[sync>account>ab12]');
        });

        it('should omit path section when path is empty', () => {
            transport.log(makeEntry({ path: [] }));
            const prefix = logSpy.mock.calls[0][0] as string;
            const afterTimestamp = prefix.split(']').slice(2).join(']');
            expect(afterTimestamp).not.toContain('[');
        });

        it('should pass message as second argument', () => {
            transport.log(makeEntry({ message: 'hello world' }));
            expect(logSpy.mock.calls[0][1]).toBe('hello world');
        });
    });
});
