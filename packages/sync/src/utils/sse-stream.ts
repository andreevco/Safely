type SSEConfig<T> = {
    url: string;
    headers: Record<string, string>;
    parsers: Record<string, (data: unknown) => T | null>;
    onUpdate: (update: T, eventId: string) => void;
    onOpen?: () => void;
    onError?: (err: Event) => void;
    signal?: AbortSignal;
    getAuthorizationHeader?: () => Promise<string>;
};

export type IsomorphicEventSource = new (
    url: string | URL,
    options?: EventSourceInit & { headers?: Record<string, string> },
    getAuthorizationHeader?: () => Promise<string>
) => EventSource;

declare global {
    const IsomorphicEventSource: IsomorphicEventSource;
}

/**
 * Converts EventSource into an async iterable.
 * Automatically closes the device-connection when iteration is complete.
 */
export class SSEStream<T> implements AsyncIterable<SSEStreamItem<T>> {
    private eventSource: EventSource | null = null;
    private queue: SSEStreamItem<T>[] = [];
    private signalResolve: ((value: IteratorResult<SSEStreamItem<T>>) => void) | null = null;
    private signalReject: ((reason?: unknown) => void) | null = null;
    private isDone = false;

    constructor(private readonly config: SSEConfig<T>) {
        if (this.config.signal) {
            this.config.signal.addEventListener('abort', () => {
                this.stop();
            });
        }
    }

    public [Symbol.asyncIterator](): AsyncIterator<SSEStreamItem<T>> {
        this.connect();

        return {
            next: () => {
                if (this.queue.length > 0) {
                    const value = this.queue.shift()!;
                    return Promise.resolve({ value, done: false });
                }
                if (this.isDone) {
                    return Promise.resolve({ value: undefined, done: true });
                }
                return new Promise<IteratorResult<SSEStreamItem<T>>>((resolve, reject) => {
                    this.signalResolve = resolve;
                    this.signalReject = reject;
                });
            },
            return: () => {
                this.stop();
                return Promise.resolve({ value: undefined, done: true });
            },
            throw: e => {
                this.stop();
                return Promise.reject(e instanceof Error ? e : new Error(String(e)));
            }
        };
    }

    private stop(error?: unknown) {
        if (this.isDone) return;

        if (this.signalResolve || this.signalReject) {
            if (error) {
                this.signalReject?.(error);
            } else {
                this.signalResolve?.({ value: undefined, done: true });
            }
        }

        this.cleanup();
    }

    private connect() {
        this.eventSource = new IsomorphicEventSource(
            this.config.url,
            {
                headers: this.config.headers
            },
            this.config.getAuthorizationHeader
        );

        this.eventSource.onopen = () => this.config.onOpen?.();

        this.eventSource.onerror = err => {
            this.config.onError?.(err);
            this.stop(err);
        };

        for (const [eventType, parser] of Object.entries(this.config.parsers)) {
            this.eventSource.addEventListener(eventType, (event: MessageEvent<string>) => {
                try {
                    const parsed = parser(JSON.parse(event.data));
                    if (parsed) this.push({ value: parsed, eventId: event.lastEventId });
                } catch (e) {
                    console.error(`Error parsing SSE event '${eventType}':`, e);
                }
            });
        }
    }

    private push(value: SSEStreamItem<T>) {
        if (this.isDone) return;
        if (this.signalResolve) {
            this.signalResolve({ value, done: false });
            this.signalResolve = null;
            this.signalReject = null;
        } else {
            this.queue.push(value);
        }
    }

    private cleanup() {
        this.isDone = true;
        this.eventSource?.close();
        this.eventSource = null;
        this.queue = [];
        console.log('SSEStream: device-connection closed and cleaned up');
    }
}

export type SSEStreamItem<T> = {
    value: T;
    eventId: string;
};
