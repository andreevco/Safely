import { useMemo } from 'react';

import { NumberFormatter } from '@safely/core';

import { useAppContext } from '../../shared';

export function useNumberFormatter() {
    const { numberFormatLocale, logger } = useAppContext();

    return useMemo(
        () => new NumberFormatter(numberFormatLocale, logger),
        [numberFormatLocale, logger]
    );
}
