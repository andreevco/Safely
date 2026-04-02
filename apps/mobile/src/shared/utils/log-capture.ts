import { Share } from 'react-native';

type LogLevel = 'log' | 'warn' | 'error' | 'info';

interface LogEntry {
    timestamp: number;
    level: LogLevel;
    message: string;
}

const MAX_ENTRIES = 2000;
const logs: LogEntry[] = [];

const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info
};

function formatArgs(args: unknown[]): string {
    return args
        .map(arg => {
            if (typeof arg === 'string') return arg;
            try {
                return JSON.stringify(arg, null, 2);
            } catch {
                return String(arg);
            }
        })
        .join(' ');
}

function capture(level: LogLevel, args: unknown[]) {
    if (typeof args[0] === 'string' && args[0].includes('[Reanimated]')) return;

    logs.push({
        timestamp: Date.now(),
        level,
        message: formatArgs(args)
    });

    if (logs.length > MAX_ENTRIES) {
        logs.splice(0, logs.length - MAX_ENTRIES);
    }
}

export function installLogCapture() {
    const levels: LogLevel[] = ['log', 'warn', 'error', 'info'];

    for (const level of levels) {
        // eslint-disable-next-line no-console
        console[level] = (...args: unknown[]) => {
            capture(level, args);
            originalConsole[level](...args);
        };
    }
}

export function shareLogs() {
    if (logs.length === 0) {
        Share.share({ message: 'No logs captured.' });
        return;
    }

    const text = logs
        .map(entry => {
            const time = new Date(entry.timestamp).toISOString().slice(11, 23);
            const tag = entry.level.toUpperCase().padEnd(5);
            return `[${time}] ${tag} ${entry.message}`;
        })
        .join('\n');

    Share.share({ message: text });
}
