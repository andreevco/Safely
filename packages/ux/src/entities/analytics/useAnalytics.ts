import { useContext, useMemo } from 'react';

import { AnalyticsContext } from './AnalyticsContext';
import { useActiveLanguage } from '../../shared/i18n/translate';
import { useAccountStoreSlot, useActiveAccountQuery } from '../account';

export interface AnalyticsApi {
    trackOnboardingOpen(input: { onboardingId: string }): Promise<void>;
    trackWalletOpen(input: {
        onboardingId: string | null;
        fiatAmount: number;
        fiatSymbol: string;
        sync: boolean;
    }): Promise<void>;
    trackSendStart(): Promise<void>;
    trackSendFinish(input: {
        cryptoCurrency: string;
        fiatAmount: number;
        fiatSymbol: string;
        error?: unknown;
    }): Promise<void>;
}

export function useAnalytics(): AnalyticsApi {
    const service = useContext(AnalyticsContext);
    if (!service) {
        throw new Error('useAnalytics must be used within AnalyticsProvider');
    }

    const lang = useActiveLanguage();
    const { data: activeAccount } = useActiveAccountQuery();
    const accountUuid = useAccountStoreSlot(activeAccount?.accountId ?? null, 'analyticsId');

    return useMemo<AnalyticsApi>(
        () => ({
            trackOnboardingOpen: input => service.trackOnboardingOpen({ ...input, lang }),
            trackWalletOpen: async input => {
                if (!accountUuid) return;

                await service.trackWalletOpen({
                    ...input,
                    accountUuid,
                    lang
                });
            },
            trackSendStart: async () => {
                if (!accountUuid) return;

                await service.trackSendStart({ accountUuid, lang });
            },
            trackSendFinish: async input => {
                if (!accountUuid) return;

                await service.trackSendFinish({
                    ...input,
                    accountUuid,
                    lang
                });
            }
        }),
        [service, accountUuid, lang]
    );
}
