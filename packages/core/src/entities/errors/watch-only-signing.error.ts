export class WatchOnlySigningError extends Error {
    constructor() {
        super('Watch-only wallets cannot sign transactions');
    }
}
