import { createContext } from 'react';

import type { AnalyticsService } from '@safely/core';

export interface AnalyticsContextValue {
    service: AnalyticsService;
    sessionId: string;
}

export const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);
