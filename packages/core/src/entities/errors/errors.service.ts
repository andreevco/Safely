import { customErrors, isCustomError } from './custom-error';

export type ErrorsConfig = {
    [key in keyof typeof customErrors]?: (err: InstanceType<(typeof customErrors)[key]>) => string;
} & { UnknownError: (err: unknown) => string };

export type TranslatableErrorsConfig = {
    [key in keyof typeof customErrors]?:
        | ((err: InstanceType<(typeof customErrors)[key]>) => string)
        | string;
} & { UnknownError?: ((err: unknown) => string) | string };

export type ParseErrorOptions = {
    displayUnknownErrors?: boolean;
};

export const getErrorText = (
    error: unknown,
    config: ErrorsConfig,
    options?: ParseErrorOptions
): string => {
    if (!isCustomError(error)) {
        if (options?.displayUnknownErrors) {
            if (typeof error === 'string') {
                return error || config.UnknownError(error);
            }

            if (!error || typeof error !== 'object') {
                return config.UnknownError(error);
            }

            if (error instanceof Error) {
                return error.message || config.UnknownError(error);
            }
        }

        return config.UnknownError(error);
    }

    const handler = config[error.constructor.name as keyof typeof customErrors];
    if (handler) {
        return handler(error);
    }

    if (options?.displayUnknownErrors) {
        return error.message || config.UnknownError(error);
    }

    return config.UnknownError(error);
};
