import { useMemo } from 'react';

import { NumberFormatter } from '@safely/core';

import { useAppContext } from '../../shared';
import { useLogger } from '../logger';

export function useNumberFormatter() {
    const logger = useLogger();
    const { numberFormatLocale } = useAppContext();

    return useMemo(
        () => new NumberFormatter(numberFormatLocale, logger),
        [numberFormatLocale, logger]
    );
}
