import { useMemo } from 'react';

import { ConfigApi } from '@safely/core';

import { useAppContext } from '../providers';

export function useConfigApi(): ConfigApi {
    const { version, build, i18n, userCountryInfo, devToken, logger } = useAppContext();

    return useMemo(
        () =>
            new ConfigApi(
                { build, version, lang: i18n.language, userCountryInfo, devToken },
                logger
            ),
        [build, version, i18n.language, userCountryInfo, devToken, logger]
    );
}
