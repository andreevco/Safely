export enum LogLevel {
    TRACE = 0,
    DEBUG = 1,
    INFO = 2,
    WARN = 3,
    ERROR = 4
}

export class Logger {
    private readonly path: string[] = [];
    private level: LogLevel = LogLevel.INFO;

    public setLevel(level: LogLevel): void {
        this.level = level;
    }

    public child(name: string): Logger {
        const childLogger = new Logger();
        childLogger.path.push(...this.path, name);
        childLogger.setLevel(this.level);
        return childLogger;
    }

    private log(level: LogLevel, ...args: unknown[]): void {
        if (level < this.level) {
            return;
        }
        let levelStr = LogLevel[level];
        if (levelStr.length === 4) {
            // Pad with space for alignment
            levelStr = ' ' + levelStr;
        }

        // level, time, path, args
        const prefix = `[${levelStr}] [${new Date().toISOString()}] [${this.path.join('>')}]`;

        if (level === LogLevel.WARN) {
            console.warn(prefix, ...args);
        } else if (level === LogLevel.ERROR) {
            console.error(prefix, ...args);
        } else {
            console.log(prefix, ...args);
        }
    }

    public trace(...args: unknown[]): void {
        this.log(LogLevel.TRACE, ...args);
    }

    public debug(...args: unknown[]): void {
        this.log(LogLevel.DEBUG, ...args);
    }

    public info(...args: unknown[]): void {
        this.log(LogLevel.INFO, ...args);
    }

    public warn(...args: unknown[]): void {
        this.log(LogLevel.WARN, ...args);
    }

    public error(...args: unknown[]): void {
        this.log(LogLevel.ERROR, ...args);
    }
}
