import { ConsoleTransport } from './console-transport';
import { ILoggerTransport } from './I-logger-transport';
import { LogEntry } from './log-entry';
import { LogLevel } from './log-level';

export class Logger {
    private readonly path: string[] = [];
    private readonly transports: ILoggerTransport[];
    private readonly appVersion?: string;
    private level: LogLevel = LogLevel.INFO;

    constructor(opts?: { transports?: ILoggerTransport[]; appVersion?: string }) {
        this.transports = opts?.transports ?? [new ConsoleTransport()];
        this.appVersion = opts?.appVersion;
    }

    public setLevel(level: LogLevel): void {
        this.level = level;
    }

    public child(name: string): Logger {
        const childLogger = new Logger({
            transports: this.transports,
            appVersion: this.appVersion
        });
        childLogger.path.push(...this.path, name);
        childLogger.setLevel(this.level);
        return childLogger;
    }

    public async flush(): Promise<void> {
        await Promise.allSettled(
            this.transports.map(async t => {
                await t.flush?.();
            })
        );
    }

    public async dispose(): Promise<void> {
        await Promise.allSettled(
            this.transports.map(async t => {
                const result = t.dispose?.();
                if (result instanceof Promise) await result;
            })
        );
    }

    public trace(...args: unknown[]): void {
        this.dispatch(LogLevel.TRACE, args);
    }

    public debug(...args: unknown[]): void {
        this.dispatch(LogLevel.DEBUG, args);
    }

    public log(...args: unknown[]): void {
        this.dispatch(LogLevel.INFO, args);
    }

    public info(...args: unknown[]): void {
        this.dispatch(LogLevel.INFO, args);
    }

    public warn(...args: unknown[]): void {
        this.dispatch(LogLevel.WARN, args);
    }

    public error(...args: unknown[]): void {
        this.dispatch(LogLevel.ERROR, args);
    }

    private dispatch(level: LogLevel, args: unknown[]): void {
        if (level < this.level) {
            return;
        }

        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            path: [...this.path],
            message: formatArgs(args),
            appVersion: this.appVersion
        };

        for (const transport of this.transports) {
            try {
                transport.log(entry);
            } catch {
                // logger should not get the app down
            }
        }
    }
}

function formatArgs(args: unknown[]): string {
    return args
        .map(arg => {
            if (typeof arg === 'string') return arg;
            if (arg instanceof Error) return arg.stack ?? arg.message;

            try {
                return JSON.stringify(arg, null, 2);
            } catch {
                return String(arg);
            }
        })
        .join(' ');
}
