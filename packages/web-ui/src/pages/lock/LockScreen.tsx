import type { FC } from 'react';
import { useEffect, useState } from 'react';

import { useTranslate } from '@safely/ux';
import Lock56 from '@safely/ux/assets/icons/56/lock-56.svg?react';
import { cx } from '@safely/web-ui/styled-system/css';

import {
    bodyStyles,
    headerStyles,
    signOutStyles,
    lockoutStyles,
    promptStyles,
    rootStyles,
    shakeStyles
} from './LockScreen.styles';
import { usePasscodeLockout } from '../../entities';
import { Button, Icon, Passcode, ScreenProtection, Text } from '../../shared';

export type LockScreenProps = {
    length: number;
    verify: (passcode: string) => Promise<boolean>;
    onUnlocked: () => void;
    onSignOut: () => void;
};

const MINUTE_SECONDS = 60;
const HOUR_SECONDS = 60 * 60;

export const LockScreen: FC<LockScreenProps> = props => {
    const { length, verify, onUnlocked, onSignOut } = props;

    const t = useTranslate();

    const [value, setValue] = useState('');
    const [hasFailed, setHasFailed] = useState(false);
    const { isLocked, remainingSeconds, recordFailure, reset } = usePasscodeLockout();

    useEffect(() => {
        if (value.length !== length) {
            return;
        }

        const entered = value;
        setValue('');

        void verify(entered).then(async isValid => {
            if (isValid) {
                await reset();
                onUnlocked();
                return;
            }

            setHasFailed(true);
            await recordFailure();
        });
    }, [value, length, verify, onUnlocked, recordFailure, reset]);

    const lockoutSubtitle = (): string => {
        if (remainingSeconds >= HOUR_SECONDS) {
            return t('passcode.lockout.subtitleHours', {
                count: Math.ceil(remainingSeconds / HOUR_SECONDS)
            });
        }

        return t('passcode.lockout.subtitleMinutes', {
            count: Math.ceil(remainingSeconds / MINUTE_SECONDS)
        });
    };

    return (
        <ScreenProtection>
            <div className={rootStyles}>
                <div className={headerStyles}>
                    <Button
                        className={signOutStyles}
                        variant="secondary"
                        size="small"
                        onClick={onSignOut}
                    >
                        {t('passcode.lockout.signOut')}
                    </Button>
                </div>

                <div className={bodyStyles}>
                    {isLocked ? (
                        <div className={lockoutStyles}>
                            <Icon asset={Lock56} size={32} tone="tertiary" />
                            <Text variant="titleS">{t('passcode.lockout.title')}</Text>
                            <Text variant="bodyM" tone="secondary">
                                {lockoutSubtitle()}
                            </Text>
                        </div>
                    ) : (
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
                    )}
                </div>
            </div>
        </ScreenProtection>
    );
};
