import type { FC } from 'react';
import { useRef, useState } from 'react';

import { useTranslate } from '@safely/ux';

import { usePasscode } from '../../../entities';
import { PasscodePage } from '../../passcode';

export type ChangePasscodeFlowProps = {
    onDone: () => void;
};

export const ChangePasscodeFlow: FC<ChangePasscodeFlowProps> = ({ onDone }) => {
    const t = useTranslate();
    const { set: setPasscode } = usePasscode();

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

        void setPasscode(passcode).then(onDone);
        created.current = '';
    };

    const onBack = (): void => {
        created.current = '';

        if (isConfirming) {
            setIsConfirming(false);
            return;
        }

        onDone();
    };

    return isConfirming ? (
        <PasscodePage
            title={t('changePasscode.reenter.title')}
            onBack={onBack}
            onSubmit={onConfirmed}
        />
    ) : (
        <PasscodePage
            title={t('changePasscode.new.title')}
            isInvalid={isMismatched}
            onBack={onBack}
            onSubmit={onCreated}
        />
    );
};
