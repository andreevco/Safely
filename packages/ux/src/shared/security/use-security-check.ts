import { useCallback } from 'react';

import { useAppContext } from '../providers';
import type { Security } from './types';

export function useSecurityCheck() {
    const { security } = useAppContext();
    return useCallback<Security['check']>((...params) => security.check(...params), [security]);
}
