import { ILoggerTransport, LoggerLifecycleContext } from './I-logger-transport';
import { LogEntry } from './log-entry';

export class CombinedTransport implements ILoggerTransport {
    constructor(private readonly transports: ILoggerTransport[]) {}

    public log(entry: LogEntry): void {
        for (const transport of this.transports) {
            try {
                transport.log(entry);
            } catch (e) {
                console.error('[CombinedTransport] transport failed', e);
            }
        }
    }

    public async onAfterAppOpened(ctx: LoggerLifecycleContext): Promise<void> {
        await Promise.all(
            this.transports.map(async transport => {
                try {
                    await transport.onAfterAppOpened?.(ctx);
                } catch (e) {
                    console.error('[CombinedTransport] onAfterAppOpened failed', e);
                }
            })
        );
    }

    public async onBeforeAppClosed(ctx: LoggerLifecycleContext): Promise<void> {
        await Promise.all(
            this.transports.map(async transport => {
                try {
                    await transport.onBeforeAppClosed?.(ctx);
                } catch (e) {
                    console.error('[CombinedTransport] onBeforeAppClosed failed', e);
                }
            })
        );
    }
}
