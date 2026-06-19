export class InvalidBlockchainAndTokenError extends Error {
    constructor(blockchain: string, token: string) {
        super(`Invalid blockchain: ${blockchain} and token: ${token}`);
    }
}
