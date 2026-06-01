import { useMemo } from 'react';

import type { WithIsActualised } from './types';

type Actualisable = { status: string; dataUpdatedAt: number };

export function useIsActualised<TResult extends Actualisable>(
    result: TResult,
    hydratedAt: number | null
): WithIsActualised<TResult> {
    const isActualised = result.status === 'success' && result.dataUpdatedAt > (hydratedAt ?? 0);

    return useMemo(() => ({ ...result, isActualised }), [result, isActualised]);
}
