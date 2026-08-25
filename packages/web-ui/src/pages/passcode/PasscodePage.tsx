import type { FC } from 'react';
import { useState } from 'react';

import { PASSCODE_LENGTH, useSubmitWhenComplete, useTranslate } from '@safely/ux';
import Xmark16 from '@safely/ux/assets/icons/16/xmark-16.svg?react';

import {
    bodyStyles,
    descriptionStyles,
    headerStyles,
    headingStyles,
    keypadFillStyles,
    lengthToggleStyles,
    popupStyles,
    shellStyles,
    titleStyles
} from './PasscodePage.styles';
import { Button, Icon, Modal, Passcode, ScreenProtection, Switch, Text } from '../../shared';

export type PasscodePageProps = {
    title: string;
    description?: string;
    isInvalid?: boolean;
    onSubmit: (code: string) => void;
    onBack: () => void;
};

export const PasscodePage: FC<PasscodePageProps> = props => {
    const { title, description, isInvalid, onSubmit, onBack } = props;

    const t = useTranslate();

    const [value, setValue] = useState('');
    const [length, setLength] = useState<number>(PASSCODE_LENGTH.short);

    useSubmitWhenComplete({
        value,
        length,
        onComplete: entered => {
            setValue('');
            onSubmit(entered);
        }
    });

    return (
        <ScreenProtection>
            <div className={shellStyles}>
                <Modal open onOpenChange={isOpen => !isOpen && onBack()}>
                    <Modal.Popup
                        className={popupStyles}
                        hasClose={false}
                        closeLabel={t('common.close')}
                    >
                        <div className={headerStyles}>
                            <Button
                                variant="secondary"
                                size="small"
                                isIconOnly
                                aria-label={t('common.close')}
                                onClick={onBack}
                            >
                                <Icon asset={Xmark16} />
                            </Button>

                            <label className={lengthToggleStyles}>
                                <Text variant="bodyM">{t('onboarding.passcode.sixDigit')}</Text>
                                <Switch
                                    checked={length === PASSCODE_LENGTH.long}
                                    onCheckedChange={isLong => {
                                        setValue('');
                                        setLength(
                                            isLong ? PASSCODE_LENGTH.long : PASSCODE_LENGTH.short
                                        );
                                    }}
                                />
                            </label>
                        </div>

                        <div className={bodyStyles}>
                            <div className={headingStyles}>
                                <Modal.Title className={titleStyles}>{title}</Modal.Title>
                                {description !== undefined && (
                                    <Modal.Description className={descriptionStyles}>
                                        {description}
                                    </Modal.Description>
                                )}
                            </div>

                            <Passcode
                                className={keypadFillStyles}
                                value={value}
                                length={length}
                                isInvalid={isInvalid}
                                onChange={setValue}
                            />
                        </div>
                    </Modal.Popup>
                </Modal>
            </div>
        </ScreenProtection>
    );
};
