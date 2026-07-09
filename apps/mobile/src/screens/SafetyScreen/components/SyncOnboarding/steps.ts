import type { ImageSourcePropType } from 'react-native';

import { resources } from '@mobile/shared/resources';

export interface SyncOnboardingStepConfig {
    id: 'protect' | 'noPaper' | 'useSync';
    illustration: ImageSourcePropType;
    titleKey: string;
    subtitleKey: string;
}

export const SYNC_ONBOARDING_STEPS: SyncOnboardingStepConfig[] = [
    {
        id: 'protect',
        illustration: resources.syncStepProtect,
        titleKey: 'safety.syncOnboarding.steps.protect.title',
        subtitleKey: 'safety.syncOnboarding.steps.protect.subtitle'
    },
    {
        id: 'noPaper',
        illustration: resources.syncStepNoPaper,
        titleKey: 'safety.syncOnboarding.steps.noPaper.title',
        subtitleKey: 'safety.syncOnboarding.steps.noPaper.subtitle'
    },
    {
        id: 'useSync',
        illustration: resources.syncStepUseSync,
        titleKey: 'safety.syncOnboarding.steps.useSync.title',
        subtitleKey: 'safety.syncOnboarding.steps.useSync.subtitle'
    }
];
