import type { FC } from 'react';
import { useEffect, useState } from 'react';

import { useTranslate } from '@safely/ux';
import Xmark16 from '@safely/ux/assets/icons/16/xmark-16.svg?react';
import { cx } from '@safely/web-ui/styled-system/css';

import {
    bodyStyles,
    closeStyles,
    headerStyles,
    promptStyles,
    rootStyles
} from './PasscodeVerification.styles';
import { usePasscodeLockout } from '../../entities';
import { Button, Icon, Passcode, Text } from '../../shared';
import { shakeStyles } from '../lock/LockScreen.styles';

export type PasscodeVerificationProps = {
    length: number;
    verify: (passcode: string) => Promise<boolean>;
    onVerified: () => void;
    onCancel: () => void;
};

export const PasscodeVerification: FC<PasscodeVerificationProps> = props => {
    const { length, verify, onVerified, onCancel } = props;

    const t = useTranslate();
    const { recordFailure, reset } = usePasscodeLockout();
    const [value, setValue] = useState('');
    const [hasFailed, setHasFailed] = useState(false);

    useEffect(() => {
        if (value.length !== length) {
            return;
        }

        const entered = value;
        setValue('');

        void verify(entered).then(async isValid => {
            if (isValid) {
                await reset();
                onVerified();
                return;
            }

            setHasFailed(true);
            await recordFailure();
        });
    }, [value, length, verify, onVerified, recordFailure, reset]);

    return (
        <div className={rootStyles}>
            <div className={headerStyles}>
                <Button
                    className={closeStyles}
                    variant="secondary"
                    size="small"
                    isIconOnly
                    aria-label={t('common.close')}
                    onClick={onCancel}
                >
                    <Icon asset={Xmark16} />
                </Button>
            </div>

            <div className={bodyStyles}>
                <div className={promptStyles}>
                    <Text variant="labelL">{t('passcode.verify.title')}</Text>

                    <Passcode
                        className={cx(hasFailed && shakeStyles)}
                        value={value}
                        length={length}
                        isInvalid={hasFailed}
                        backspaceLabel={t('onboarding.passcode.backspace')}
                        onChange={next => {
                            setHasFailed(false);
                            setValue(next);
                        }}
                    />
                </div>
            </div>
        </div>
    );
};
