import { getLocales } from 'expo-localization';
import { useEffect } from 'react';

import {
    useAccounts,
    useActiveAccountQuery,
    useActivePortfolioEntitiesIdsQuery,
    useAmountInputType,
    useAppContext,
    useBootConfigQuery
} from '@safely/ux';

import { useLockScreenQuery, usePasscode, usePasscodeLockout } from '@mobile/entities/security';

function useBootConfigDiagnostics(flags: unknown) {
    const { build, version, i18n, userCountryInfo, devToken } = useAppContext();

    useEffect(() => {
        const query = new URLSearchParams({
            lang: i18n.language,
            platform: build,
            version,
            ...(userCountryInfo?.deviceCode && { device_country_code: userCountryInfo.deviceCode }),
            ...(userCountryInfo?.storeCode && { store_country_code: userCountryInfo.storeCode }),
            ...(devToken && { dev_token: devToken })
        });

        // eslint-disable-next-line no-console -- temporary e2e diagnostics, logcat is the only CI-readable sink
        console.log(
            '[boot-config]',
            JSON.stringify({
                url: `https://config.safely.app/v1/config?${query.toString()}`,
                userCountryInfo: userCountryInfo ?? null,
                locales: getLocales(),
                flags
            })
        );
    }, [build, version, i18n.language, userCountryInfo, devToken, flags]);
}

export function RootSuspenseDependencies() {
    const { data: bootConfig } = useBootConfigQuery();

    useAccounts();
    useActiveAccountQuery();
    usePasscode();
    useLockScreenQuery();
    usePasscodeLockout();
    useActivePortfolioEntitiesIdsQuery();
    useAmountInputType();

    useBootConfigDiagnostics(bootConfig.flags);

    return null;
}
