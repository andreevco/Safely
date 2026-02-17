import { useCallback } from 'react';

import { Security } from '../../entities';
import { useAppContext } from '../providers';

export function useSecurityCheck() {
    const { security } = useAppContext();
    return useCallback<Security['check']>((...params) => security.check(...params), [security]);
}
