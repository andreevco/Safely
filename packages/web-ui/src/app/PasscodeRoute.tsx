import type { FC } from 'react';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router';

import { useTranslate } from '@safely/ux';

import { ROUTE } from './routes';
import type { PasscodeStorage } from '../entities';
import { useOnboardingFlow } from './useOnboardingFlow';
import { PasscodePage } from '../pages';

export type PasscodeRouteProps = {
    passcodeStorage: PasscodeStorage;
};

export const PasscodeRoute: FC<PasscodeRouteProps> = props => {
    const { passcodeStorage } = props;

    const t = useTranslate();
    const navigate = useNavigate();
    const { onPasscodeConfirmed } = useOnboardingFlow(passcodeStorage);

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

        void navigate(ROUTE.onboarding.welcome);
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
