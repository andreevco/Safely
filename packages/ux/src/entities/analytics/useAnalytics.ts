import { useContext, useMemo } from 'react';

import { AnalyticsContext } from './AnalyticsContext';
import { useAccountUuid } from './useAccountUuid';
import { useActiveLanguage } from '../../shared/i18n/translate';
import { useActiveFiat } from '../fiat/useActiveFiat';

export interface AnalyticsApi {
    trackOnboardingOpen(input: { onboardingId: string }): Promise<void>;
    trackWalletOpen(input: {
        onboardingId: string;
        fiatAmount: number;
        sync: boolean;
    }): Promise<void>;
    trackSendStart(): Promise<void>;
    trackSendFinish(input: {
        cryptoCurrency: string;
        fiatAmount: number;
        errorType: string | null;
    }): Promise<void>;
}

export function useAnalytics(): AnalyticsApi {
    const service = useContext(AnalyticsContext);
    if (!service) {
        throw new Error('useAnalytics must be used within AnalyticsProvider');
    }

    const lang = useActiveLanguage();
    const { data: accountUuid } = useAccountUuid();
    const fiat = useActiveFiat();

    const fiatSymbol = fiat.id.symbol;

    return useMemo<AnalyticsApi>(
        () => ({
            trackOnboardingOpen: input => service.trackOnboardingOpen({ ...input, lang }),
            trackWalletOpen: async input => {
                if (!accountUuid) return;

                await service.trackWalletOpen({
                    ...input,
                    accountUuid,
                    fiatSymbol,
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
                    fiatSymbol,
                    lang
                });
            }
        }),
        [service, accountUuid, fiatSymbol, lang]
    );
}
