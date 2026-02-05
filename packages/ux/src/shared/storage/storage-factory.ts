import { useMemo } from 'react';

import { AppStorageFactory } from '@safely/core';

import { useAppSdk } from '../providers';

export function useStorageFactory() {
    const { storage } = useAppSdk();

    return useMemo(() => new AppStorageFactory(storage), [storage]);
}
