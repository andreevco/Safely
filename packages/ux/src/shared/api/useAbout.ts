import { keepPreviousData } from '@tanstack/react-query';
import { useMemo } from 'react';

import { AboutApi } from '@safely/core';
import type { About } from '@safely/core';

import { apiKeys } from './keys';
import { useAppContext } from '../providers';
import { usePersistQuery } from '../query-core';

export function useAboutApi(): AboutApi {
    const { version, build, i18n, userCountryInfo, devToken } = useAppContext();

    return useMemo(
        () => new AboutApi({ build, version, lang: i18n.language, userCountryInfo, devToken }),
        [build, version, i18n.language, userCountryInfo, devToken]
    );
}

export function useAboutQuery() {
    const aboutApi = useAboutApi();

    return usePersistQuery<About>({
        queryKey: apiKeys.about(aboutApi.id).toKey(),
        queryFn: () => aboutApi.getAbout(),
        schemaKey: 'about',
        placeholderData: keepPreviousData
    });
}
