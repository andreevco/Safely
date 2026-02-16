import { InvalidMnemonicError } from './invalid-mnemonic.error';
import { PortfolioAlreadyExistsError } from './portfolio-already-exists.error';
import { PortfolioGenerationFailedError } from './portfolio-generation-failed.error';

export const customErrors = {
    InvalidMnemonicError,
    PortfolioAlreadyExistsError,
    PortfolioGenerationFailedError
} as const;
export type CustomError = InstanceType<(typeof customErrors)[keyof typeof customErrors]>;

export function isCustomError(err: unknown): err is CustomError {
    return Object.values(customErrors).some(v => err instanceof v);
}
