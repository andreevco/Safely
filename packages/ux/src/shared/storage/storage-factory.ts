import { useMemo } from 'react';

import { AppStorageFactory } from '@safely/core';

import { useAppContext } from '../providers';

export function useStorageFactory() {
    const { storage } = useAppContext();

    return useMemo(() => new AppStorageFactory(storage), [storage]);
}
