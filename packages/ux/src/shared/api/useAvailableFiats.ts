import { useMemo } from 'react';

import { FiatAsset } from '@safely/core';

import { useBootConfig } from './useBootConfig';

export function useAvailableFiats() {
    const { currencies } = useBootConfig();

    return useMemo(
        () =>
            currencies.supported_currencies.map(({ description, slug }) =>
                FiatAsset.create({ name: description, symbol: slug })
            ),
        [currencies]
    );
}
