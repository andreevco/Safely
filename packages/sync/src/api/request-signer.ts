export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';

export interface RequestSigner {
    sign(method: HTTPMethod, pathWithQuery: string, body: string): Promise<string>;
}
