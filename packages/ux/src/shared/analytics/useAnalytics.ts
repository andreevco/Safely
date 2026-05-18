import { useContext } from 'react';

import type { AnalyticsService } from '@safely/core';

import { AnalyticsContext } from './AnalyticsContext';

export function useAnalytics(): AnalyticsService {
    const ctx = useContext(AnalyticsContext);
    if (!ctx) {
        throw new Error('useAnalytics must be used within AnalyticsProvider');
    }

    return ctx;
}
