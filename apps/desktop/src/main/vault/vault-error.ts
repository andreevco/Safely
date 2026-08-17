import type { VaultErrorCode } from '../../shared/ipc';

/**
 * The message is the code and nothing else: it crosses IPC into the renderer verbatim. Anything
 * diagnostic — an OSStatus, a path — belongs on `cause`, which stays in main.
 */
export class VaultError extends Error {
    constructor(
        public readonly code: VaultErrorCode,
        options?: ErrorOptions
    ) {
        super(code, options);

        this.name = 'VaultError';
    }
}
