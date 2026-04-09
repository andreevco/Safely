import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ILoggerTransport, LogEntry, LogLevel, Logger } from '../../src';

function createMockTransport(): ILoggerTransport & {
    entries: LogEntry[];
    flushCalls: number;
    disposeCalls: number;
} {
    const transport = {
        entries: [] as LogEntry[],
        flushCalls: 0,
        disposeCalls: 0,
        log(entry: LogEntry) {
            transport.entries.push(entry);
        },
        async flush() {
            transport.flushCalls++;
        },
        dispose() {
            transport.disposeCalls++;
        }
    };

    return transport;
}

describe('Logger', () => {
    let transport: ReturnType<typeof createMockTransport>;
    let logger: Logger;

    beforeEach(() => {
        transport = createMockTransport();
        logger = new Logger({ transports: [transport] });
    });

    describe('level filtering', () => {
        it('should dispatch entries at or above the current level', () => {
            logger.setLevel(LogLevel.WARN);
            logger.warn('w');
            logger.error('e');
            expect(transport.entries).toHaveLength(2);
        });

        it('should suppress entries below the current level', () => {
            logger.setLevel(LogLevel.WARN);
            logger.trace('t');
            logger.debug('d');
            logger.info('i');
            expect(transport.entries).toHaveLength(0);
        });

        it('should default to INFO level', () => {
            logger.trace('t');
            logger.debug('d');
            logger.info('i');
            expect(transport.entries).toHaveLength(1);
            expect(transport.entries[0].level).toBe(LogLevel.INFO);
        });

        it('should respect setLevel changes after construction', () => {
            logger.setLevel(LogLevel.TRACE);
            logger.trace('t');
            expect(transport.entries).toHaveLength(1);

            logger.setLevel(LogLevel.ERROR);
            logger.warn('w');
            expect(transport.entries).toHaveLength(1);
        });
    });

    describe('formatArgs', () => {
        beforeEach(() => {
            logger.setLevel(LogLevel.TRACE);
        });

        it('should pass string arguments through unchanged', () => {
            logger.trace('hello world');
            expect(transport.entries[0].message).toBe('hello world');
        });

        it('should serialize Error with stack trace', () => {
            const err = new Error('test error');
            logger.trace(err);
            expect(transport.entries[0].message).toContain('test error');
            expect(transport.entries[0].message).toContain('logger.spec.ts');
        });

        it('should serialize Error with message when stack is undefined', () => {
            const err = new Error('no stack');
            err.stack = undefined;
            logger.trace(err);
            expect(transport.entries[0].message).toBe('no stack');
        });

        it('should JSON.stringify plain objects', () => {
            logger.trace({ a: 1 });
            expect(transport.entries[0].message).toBe('{\n  "a": 1\n}');
        });

        it('should fall back to String() for circular objects', () => {
            const obj: Record<string, unknown> = {};
            obj.self = obj;
            logger.trace(obj);
            expect(transport.entries[0].message).toBe('[object Object]');
        });

        it('should join multiple arguments with space', () => {
            logger.trace('hello', 'world', 42);
            expect(transport.entries[0].message).toBe('hello world 42');
        });

        it('should handle empty args', () => {
            logger.trace();
            expect(transport.entries[0].message).toBe('');
        });
    });

    describe('transport delegation', () => {
        it('should call log on every transport', () => {
            const t2 = createMockTransport();
            const multi = new Logger({ transports: [transport, t2] });
            multi.info('msg');
            expect(transport.entries).toHaveLength(1);
            expect(t2.entries).toHaveLength(1);
        });

        it('should use ConsoleTransport by default when no transports given', () => {
            const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
            const defaultLogger = new Logger();
            defaultLogger.info('test');
            expect(spy).toHaveBeenCalled();
            spy.mockRestore();
        });

        it('should swallow transport errors', () => {
            const badTransport: ILoggerTransport = {
                log() {
                    throw new Error('boom');
                }
            };
            const safe = new Logger({ transports: [badTransport, transport] });
            expect(() => safe.info('msg')).not.toThrow();
            expect(transport.entries).toHaveLength(1);
        });

        it('should pass a copy of path array in the entry', () => {
            const child = logger.child('a');
            child.info('msg');
            const entryPath = transport.entries[0].path;
            entryPath.push('mutated');
            child.info('msg2');
            expect(transport.entries[1].path).toEqual(['a']);
        });

        it('should include appVersion when provided', () => {
            const versioned = new Logger({ transports: [transport], appVersion: '1.0.0' });
            versioned.info('msg');
            expect(transport.entries[0].appVersion).toBe('1.0.0');
        });

        it('should omit appVersion when not provided', () => {
            logger.info('msg');
            expect(transport.entries[0].appVersion).toBeUndefined();
        });
    });

    describe('child', () => {
        it('should append name to parent path', () => {
            logger.setLevel(LogLevel.TRACE);
            const child = logger.child('svc');
            child.trace('msg');
            expect(transport.entries[0].path).toEqual(['svc']);
        });

        it('should support multi-level nesting', () => {
            logger.setLevel(LogLevel.TRACE);
            const child = logger.child('a').child('b').child('c');
            child.trace('msg');
            expect(transport.entries[0].path).toEqual(['a', 'b', 'c']);
        });

        it('should share transports with parent', () => {
            const child = logger.child('x');
            child.info('msg');
            expect(transport.entries).toHaveLength(1);
        });

        it('should inherit parent level', () => {
            logger.setLevel(LogLevel.ERROR);
            const child = logger.child('x');
            child.warn('msg');
            expect(transport.entries).toHaveLength(0);
            child.error('msg');
            expect(transport.entries).toHaveLength(1);
        });

        it('should not mutate parent path', () => {
            logger.setLevel(LogLevel.TRACE);
            logger.child('a');
            logger.trace('msg');
            expect(transport.entries[0].path).toEqual([]);
        });

        it('should inherit appVersion', () => {
            const versioned = new Logger({ transports: [transport], appVersion: '2.0' });
            const child = versioned.child('x');
            child.info('msg');
            expect(transport.entries[0].appVersion).toBe('2.0');
        });
    });

    describe('convenience methods', () => {
        beforeEach(() => {
            logger.setLevel(LogLevel.TRACE);
        });

        it('should dispatch TRACE via trace()', () => {
            logger.trace('t');
            expect(transport.entries[0].level).toBe(LogLevel.TRACE);
        });

        it('should dispatch DEBUG via debug()', () => {
            logger.debug('d');
            expect(transport.entries[0].level).toBe(LogLevel.DEBUG);
        });

        it('should dispatch INFO via log()', () => {
            logger.log('l');
            expect(transport.entries[0].level).toBe(LogLevel.INFO);
        });

        it('should dispatch INFO via info()', () => {
            logger.info('i');
            expect(transport.entries[0].level).toBe(LogLevel.INFO);
        });

        it('should dispatch WARN via warn()', () => {
            logger.warn('w');
            expect(transport.entries[0].level).toBe(LogLevel.WARN);
        });

        it('should dispatch ERROR via error()', () => {
            logger.error('e');
            expect(transport.entries[0].level).toBe(LogLevel.ERROR);
        });
    });

    describe('flush', () => {
        it('should call flush on all transports', async () => {
            const t2 = createMockTransport();
            const multi = new Logger({ transports: [transport, t2] });
            await multi.flush();
            expect(transport.flushCalls).toBe(1);
            expect(t2.flushCalls).toBe(1);
        });

        it('should tolerate transports without flush', async () => {
            const minimal: ILoggerTransport = { log: vi.fn() };
            const l = new Logger({ transports: [minimal] });
            await expect(l.flush()).resolves.toBeUndefined();
        });

        it('should settle even when one transport flush rejects', async () => {
            const failing: ILoggerTransport = {
                log: vi.fn(),
                async flush() {
                    throw new Error('fail');
                }
            };
            const l = new Logger({ transports: [failing, transport] });
            await expect(l.flush()).resolves.toBeUndefined();
            expect(transport.flushCalls).toBe(1);
        });
    });

    describe('dispose', () => {
        it('should call dispose on all transports', async () => {
            const t2 = createMockTransport();
            const multi = new Logger({ transports: [transport, t2] });
            await multi.dispose();
            expect(transport.disposeCalls).toBe(1);
            expect(t2.disposeCalls).toBe(1);
        });

        it('should tolerate transports without dispose', async () => {
            const minimal: ILoggerTransport = { log: vi.fn() };
            const l = new Logger({ transports: [minimal] });
            await expect(l.dispose()).resolves.toBeUndefined();
        });
    });
});
