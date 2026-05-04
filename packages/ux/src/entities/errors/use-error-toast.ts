import { useCallback } from 'react';

import { TranslatableErrorsConfig } from '@safely/core';

import { type ParseErrorOptions, useParseError } from '../../shared';
import { useToast } from '../toast';

export function useErrorToast(config: TranslatableErrorsConfig, options?: ParseErrorOptions) {
    const toast = useToast();
    const parseError = useParseError(config, options);

    return useCallback(
        (e: unknown) => {
            toast({ message: parseError(e), type: 'error' });
        },
        [toast, parseError]
    );
}
