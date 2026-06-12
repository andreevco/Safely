import { sha256 } from '@noble/hashes/sha2.js';

import type { Logger } from './logger';

export type SyncFlowLogFields = Record<string, unknown>;

export type SyncFlowLoggerOptions = {
    flowId?: string;
    startedAt?: number;
};

type SyncFlowRunner<T> = (flow: SyncFlowLogger) => T | Promise<T>;

type LogPhase = 'start' | 'step' | 'end' | 'fail' | 'incomplete';
type BufferedLog = {
    phase: LogPhase;
    event: SyncFlowLogFields;
};
type SyncFlowLoggerState = {
    flowId: string;
    bufferedLogs: BufferedLog[];
};

const HEX_SHORT_LENGTH = 16;

export class SyncFlowLogger {
    private startedAt: number;
    private completed = false;
    private startLogged = false;
    private state: SyncFlowLoggerState;

    constructor(
        private readonly logger: Logger,
        private readonly flow: string,
        private readonly context: SyncFlowLogFields = {},
        private readonly options: SyncFlowLoggerOptions = {}
    ) {
        this.state = {
            flowId: options.flowId ?? makeFlowId(),
            bufferedLogs: []
        };
        this.startedAt = options.startedAt ?? Date.now();
    }

    public static start(
        logger: Logger,
        flow: string,
        context: SyncFlowLogFields = {},
        options: SyncFlowLoggerOptions = {}
    ): SyncFlowLogger {
        const flowLogger = new SyncFlowLogger(logger, flow, context, options);
        flowLogger.logStart();
        return flowLogger;
    }

    public child(flow: string, context: SyncFlowLogFields = {}): SyncFlowLogger {
        const child = new SyncFlowLogger(
            this.logger,
            joinLogPath(this.flow, flow),
            {
                ...this.context,
                ...context
            },
            {
                startedAt: this.startedAt,
                flowId: this.state.flowId
            }
        );
        child.state = this.state;
        return child;
    }

    public logStart(fields: SyncFlowLogFields = {}): void {
        this.startedAt = Date.now();
        this.startLogged = true;
        this.write('start', undefined, fields);
    }

    public logStep(step: string, fields: SyncFlowLogFields = {}): void {
        this.state.bufferedLogs.push({
            phase: 'step',
            event: this.makeEvent(step, fields)
        });
    }

    public logEnd(step: string, fields: SyncFlowLogFields = {}): void {
        this.completed = true;
        this.ensureStartLogged();
        this.write('end', step, fields);
    }

    public logFail(error: unknown, step: string, fields: SyncFlowLogFields = {}): void {
        this.completed = true;
        this.ensureStartLogged();
        this.flushBufferedLogs();
        this.write('fail', step, {
            ...fields,
            error: summarizeError(error)
        });
    }

    public logIncomplete(step: string, fields: SyncFlowLogFields = {}): void {
        this.completed = true;
        this.ensureStartLogged();
        this.flushBufferedLogs();
        this.write('incomplete', step, fields);
    }

    public isCompleted(): boolean {
        return this.completed;
    }

    private ensureStartLogged(): void {
        if (this.startLogged) {
            return;
        }

        this.startLogged = true;
        this.write('start');
    }

    private flushBufferedLogs(): void {
        const logs = this.state.bufferedLogs.splice(0);
        for (const log of logs) {
            this.dispatch(log.phase, log.event);
        }
    }

    private write(phase: LogPhase, step?: string, fields: SyncFlowLogFields = {}): void {
        this.dispatch(phase, this.makeEvent(step, fields));
    }

    private makeEvent(step?: string, fields: SyncFlowLogFields = {}): SyncFlowLogFields {
        return {
            flow: step === undefined ? this.flow : joinLogPath(this.flow, step),
            flowId: this.state.flowId,
            elapsedMs: this.elapsedMs(),
            ...this.context,
            ...fields
        };
    }

    private dispatch(phase: LogPhase, event: SyncFlowLogFields): void {
        if (phase === 'fail') {
            this.logger.error('sync.flow', event);
        } else if (phase === 'incomplete') {
            this.logger.warn('sync.flow', event);
        } else {
            this.logger.info('sync.flow', event);
        }
    }

    private elapsedMs(): number {
        return Math.max(0, Date.now() - this.startedAt);
    }
}

export function makeQrLogId(data: Buffer | Uint8Array | string): string {
    const bytes = typeof data === 'string' ? Buffer.from(data, 'utf8') : new Uint8Array(data);
    return Buffer.from(sha256(bytes)).toString('hex').slice(0, HEX_SHORT_LENGTH);
}

export async function withSyncFlow<T>(
    logger: Logger,
    flow: string,
    context: SyncFlowLogFields,
    run: SyncFlowRunner<T>,
    options: SyncFlowLoggerOptions = {}
): Promise<T> {
    const flowLogger = SyncFlowLogger.start(logger, flow, context, options);

    try {
        const result = await run(flowLogger);
        if (!flowLogger.isCompleted()) {
            flowLogger.logIncomplete('callback.returned');
        }
        return result;
    } catch (error) {
        if (!flowLogger.isCompleted()) {
            flowLogger.logFail(error, 'exception');
        }
        throw error;
    }
}

function summarizeError(error: unknown): SyncFlowLogFields {
    if (error instanceof Error) {
        const maybeCode = (error as { code?: unknown }).code;
        const maybeStatus = (error as { status?: unknown }).status;
        const maybeCause = (error as { cause?: unknown }).cause;
        return {
            name: error.name,
            message: error.message,
            ...(maybeCode !== undefined ? { code: maybeCode } : {}),
            ...(maybeStatus !== undefined ? { status: maybeStatus } : {}),
            ...(maybeCause !== undefined ? { cause: maybeCause } : {})
        };
    }

    return {
        message: String(error)
    };
}

function makeFlowId(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function joinLogPath(...parts: string[]): string {
    return parts.filter(Boolean).join('.');
}
