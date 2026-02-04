import { EventSource } from 'eventsource';

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
(globalThis as any).IsomorphicEventSource = class BrowserIsomorphicEventSource {
    constructor(url: string | URL, opts?: EventSourceInit & { headers?: Record<string, string> }) {
        return new EventSource(url, {
            ...(opts as unknown as Record<string, unknown>),
            fetch: (u: string | URL, init?: RequestInit) =>
                fetch(u, {
                    ...init,
                    headers: { ...init?.headers, ...opts?.headers }
                })
        });
    }
};
