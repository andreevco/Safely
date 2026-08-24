import type { FC } from 'react';
import { useEffect, useState } from 'react';

import { useTranslate } from '@safely/ux';
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
import { Button, Icon, Modal, Passcode, Switch, Text } from '../../shared';

export type PasscodePageProps = {
    title: string;
    description: string;
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
                                checked={length === LONG_LENGTH}
                                onCheckedChange={isLong => {
                                    setValue('');
                                    setLength(isLong ? LONG_LENGTH : SHORT_LENGTH);
                                }}
                            />
                        </label>
                    </div>

                    <div className={bodyStyles}>
                        <div className={headingStyles}>
                            <Modal.Title className={titleStyles}>{title}</Modal.Title>
                            <Modal.Description className={descriptionStyles}>
                                {description}
                            </Modal.Description>
                        </div>

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
        </div>
    );
};
