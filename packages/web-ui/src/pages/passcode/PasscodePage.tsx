import type { FC } from 'react';
import { useEffect, useState } from 'react';

import { useTranslate } from '@safely/ux';

import {
    bodyStyles,
    descriptionStyles,
    keypadFillStyles,
    lengthToggleStyles,
    popupStyles
} from './PasscodePage.styles';
import { Modal, Passcode, ScreenProtection, Switch, Text } from '../../shared';

export type PasscodePageProps = {
    title: string;
    description?: string;
    isInvalid?: boolean;
    onSubmit: (code: string) => void;
    onBack: () => void;
};

const SHORT_LENGTH = 4;
const LONG_LENGTH = 6;

export const PasscodePage: FC<PasscodePageProps> = props => {
    const { title, description, isInvalid, onSubmit, onBack } = props;

    const t = useTranslate();

    const [value, setValue] = useState('');
    const [length, setLength] = useState(SHORT_LENGTH);

    useEffect(() => {
        if (value.length !== length) {
            return;
        }

        onSubmit(value);
        setValue('');
    }, [value, length, onSubmit]);

    return (
        <ScreenProtection>
            <Modal open disablePointerDismissal onOpenChange={isOpen => !isOpen && onBack()}>
                <Modal.Popup
                    className={popupStyles}
                    hasClose={false}
                    closeLabel={t('common.close')}
                >
                    <Modal.Header closeLabel={t('common.close')}>
                        <label className={lengthToggleStyles}>
                            <Text variant="bodyM">{t('onboarding.passcode.sixDigit')}</Text>
                            <Switch
                                checked={length === LONG_LENGTH}
                                onCheckedChange={isLong => {
                                    setValue('');
                                    setLength(isLong ? LONG_LENGTH : SHORT_LENGTH);
                                }}
                            />
                        </label>
                    </Modal.Header>

                    <div className={bodyStyles}>
                        <Modal.Content hasFloatingClose={false}>
                            <Modal.Title>{title}</Modal.Title>
                            {description !== undefined && (
                                <Modal.Description className={descriptionStyles}>
                                    {description}
                                </Modal.Description>
                            )}
                        </Modal.Content>

                        <Passcode
                            className={keypadFillStyles}
                            value={value}
                            length={length}
                            isInvalid={isInvalid}
                            backspaceLabel={t('onboarding.passcode.backspace')}
                            onChange={setValue}
                        />
                    </div>
                </Modal.Popup>
            </Modal>
        </ScreenProtection>
    );
};
