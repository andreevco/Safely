import { useMemo } from 'react';

import { useAppContext } from '../../shared';

export function useLoader() {
    const { loader } = useAppContext();

    return useMemo(
        () => ({
            showLoader: loader.show,
            hideLoader: loader.hide,
            withLoader: loader.withLoader
        }),
        [loader]
    );
}
