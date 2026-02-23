import { InvalidMnemonicError } from './invalid-mnemonic.error';
import { PortfolioAlreadyExistsError } from './portfolio-already-exists.error';
import { PortfolioGenerationFailedError } from './portfolio-generation-failed.error';
import { BtcSendDustError } from '../../blockchain-api/btc/errors';

export const customErrors = {
    InvalidMnemonicError,
    PortfolioAlreadyExistsError,
    PortfolioGenerationFailedError,
    BtcSendDustError
} as const;
export type CustomError = InstanceType<(typeof customErrors)[keyof typeof customErrors]>;

export function isCustomError(err: unknown): err is CustomError {
    if (typeof err !== 'object' || err === null) {
        return false;
    }
    return Object.values(customErrors).some(v => err instanceof v);
}
