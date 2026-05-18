import { createContext } from 'react';

import type { AnalyticsService } from '@safely/core';

export const AnalyticsContext = createContext<AnalyticsService | null>(null);
