import z from 'zod';

import { MAIN_MODALS, SETTINGS_SECTIONS } from '@safely/web-ui';

export const ROUTE = {
    main: '/',
    updates: '/updates',
    safety: '/safety',
    settings: '/settings/{-$section}',
    devTools: '/dev-tools',
    onboarding: {
        welcome: '/onboarding'
    }
} as const;

export const sSettingsParams = z.object({
    section: z.enum(SETTINGS_SECTIONS).optional().catch(undefined)
});

export const sMainSearch = z.object({
    modal: z.enum(MAIN_MODALS).optional().catch(undefined)
});

export type SettingsParams = z.infer<typeof sSettingsParams>;
export type MainSearch = z.infer<typeof sMainSearch>;
