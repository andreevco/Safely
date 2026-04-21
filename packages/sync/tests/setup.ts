import { EventSource } from 'eventsource';

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
(globalThis as any).IsomorphicEventSource = class BrowserIsomorphicEventSource {
    constructor(
        url: string | URL,
        opts?: EventSourceInit & { headers?: Record<string, string> },
        getAuthorizationHeader?: () => Promise<string>
    ) {
        return new EventSource(url, {
            ...(opts as unknown as Record<string, unknown>),
            fetch: async (u: string | URL, init?: RequestInit) => {
                const initHeaders = (init?.headers ?? {}) as Record<string, string>;
                const optionHeaders = { ...(opts?.headers ?? {}) };

                const headers = { ...initHeaders, ...optionHeaders } as Record<string, string>;

                if (getAuthorizationHeader) {
                    const authorizationHeader = await getAuthorizationHeader();
                    if (authorizationHeader !== undefined && authorizationHeader !== null) {
                        for (const key of Object.keys(headers)) {
                            if (key.toLowerCase() === 'authorization') {
                                delete headers[key];
                            }
                        }
                        headers.Authorization = authorizationHeader;
                    }
                }

                return fetch(u, {
                    ...init,
                    headers
                });
            }
        });
    }
};
