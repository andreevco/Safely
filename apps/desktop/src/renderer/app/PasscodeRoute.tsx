import { useNavigate } from '@tanstack/react-router';
import type { FC } from 'react';
import { useRef, useState } from 'react';

import { useTranslate } from '@safely/ux';
import { PasscodePage } from '@safely/web-ui';

import { ROUTE } from './routes';
import { useOnboardingFlow } from './useOnboardingFlow';

export const PasscodeRoute: FC = () => {
    const t = useTranslate();
    const navigate = useNavigate();
    const { onPasscodeConfirmed } = useOnboardingFlow();

    const created = useRef('');
    const [isConfirming, setIsConfirming] = useState(false);
    const [isMismatched, setIsMismatched] = useState(false);

    const onCreated = (passcode: string): void => {
        created.current = passcode;
        setIsMismatched(false);
        setIsConfirming(true);
    };

    const onConfirmed = (passcode: string): void => {
        if (passcode !== created.current) {
            created.current = '';
            setIsMismatched(true);
            setIsConfirming(false);
            return;
        }

        void onPasscodeConfirmed(passcode);
        created.current = '';
    };

    const onBack = (): void => {
        created.current = '';

        if (isConfirming) {
            setIsConfirming(false);
            return;
        }

        void navigate({ to: ROUTE.onboarding.welcome });
    };

    return isConfirming ? (
        <PasscodePage
            title={t('onboarding.passcode.reenter.title')}
            description={t('onboarding.passcode.reenter.description')}
            onBack={onBack}
            onSubmit={onConfirmed}
        />
    ) : (
        <PasscodePage
            title={t('onboarding.passcode.title')}
            description={t('onboarding.passcode.description')}
            isInvalid={isMismatched}
            onBack={onBack}
            onSubmit={onCreated}
        />
    );
};
