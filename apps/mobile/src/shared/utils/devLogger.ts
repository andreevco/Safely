interface ILogEntry {
    level: string;
    message: string;
    timestamp: number;
}

let logs: ILogEntry[] = [];
const MAX_LOGS = 500;
const subscribers = new Set<() => void>();

const notify = () => subscribers.forEach(fn => fn());

export function initDevLogger() {
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    const capture =
        (level: string, original: (...args: unknown[]) => void) =>
        (...args: unknown[]) => {
            original(...args);
            logs = [{ timestamp: Date.now(), level, message: args.map(String).join(' ') }, ...logs];

            if (logs.length > MAX_LOGS) {
                logs = logs.slice(0, MAX_LOGS);
            }

            notify();
        };

    console.log = capture('log', originalLog) as typeof console.log;
    console.warn = capture('warn', originalWarn) as typeof console.warn;
    console.error = capture('error', originalError) as typeof console.error;
}

export function getDevLogs(): ILogEntry[] {
    return logs;
}

export function clearDevLogs() {
    logs = [];

    notify();
}

export function subscribeDevLogs(fn: () => void) {
    subscribers.add(fn);

    return () => {
        subscribers.delete(fn);
    };
}
