import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useOnboardingFlow } from '@mobile/features/onboarding';
import { PasscodeSetup } from '@mobile/shared/ui';

export const OnboardingPasscodeScreen = () => {
    const { t } = useTranslation();
    const { onPasscodeReady } = useOnboardingFlow();

    const handleComplete = useCallback(
        (passcode: string) => {
            onPasscodeReady(passcode);
        },
        [onPasscodeReady]
    );

    return (
        <PasscodeSetup
            headerType="back"
            title={t('onboarding.passcode.title')}
            reenterTitle={t('onboarding.passcode.reenter.title')}
            description={t('onboarding.passcode.description')}
            reenterDescription={t('onboarding.passcode.reenter.description')}
            onComplete={handleComplete}
        />
    );
};
