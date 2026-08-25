import { useNavigate } from '@tanstack/react-router';
import type { FC } from 'react';

import { useTranslate } from '@safely/ux';

import { ROUTE } from './routes';
import { useOnboardingFlow } from './useOnboardingFlow';
import { PasscodeSetupFlow } from '../features';

export const PasscodeRoute: FC = () => {
    const t = useTranslate();
    const navigate = useNavigate();
    const { onPasscodeConfirmed } = useOnboardingFlow();

    return (
        <PasscodeSetupFlow
            create={{
                title: t('onboarding.passcode.title'),
                description: t('onboarding.passcode.description')
            }}
            confirm={{
                title: t('onboarding.passcode.reenter.title'),
                description: t('onboarding.passcode.reenter.description')
            }}
            onConfirmed={passcode => void onPasscodeConfirmed(passcode)}
            onCancel={() => void navigate({ to: ROUTE.onboarding.welcome })}
        />
    );
};
