import type { FC } from 'react';
import { useRef, useState } from 'react';

import { useTranslate } from '@safely/ux';

import { PasscodePage } from './PasscodePage';

export type PasscodeSetupProps = {
    onComplete: (passcode: string) => void;
    onBack: () => void;
};

export const PasscodeSetup: FC<PasscodeSetupProps> = ({ onComplete, onBack }) => {
    const t = useTranslate();

    const created = useRef('');
    const [isConfirming, setIsConfirming] = useState(false);
    const [isMismatched, setIsMismatched] = useState(false);

    const handleCreated = (passcode: string): void => {
        created.current = passcode;
        setIsMismatched(false);
        setIsConfirming(true);
    };

    const handleConfirmed = (passcode: string): void => {
        const isMatching = passcode === created.current;
        created.current = '';

        if (!isMatching) {
            setIsMismatched(true);
            setIsConfirming(false);
            return;
        }

        onComplete(passcode);
    };

    const handleBack = (): void => {
        created.current = '';

        if (isConfirming) {
            setIsConfirming(false);
            return;
        }

        onBack();
    };

    return isConfirming ? (
        <PasscodePage
            title={t('onboarding.passcode.reenter.title')}
            description={t('onboarding.passcode.reenter.description')}
            onBack={handleBack}
            onSubmit={handleConfirmed}
        />
    ) : (
        <PasscodePage
            title={t('onboarding.passcode.title')}
            description={t('onboarding.passcode.description')}
            isInvalid={isMismatched}
            onBack={handleBack}
            onSubmit={handleCreated}
        />
    );
};
