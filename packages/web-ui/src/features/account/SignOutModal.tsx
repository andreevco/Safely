import type { FC } from 'react';
import { useState } from 'react';

import { useTranslate } from '@safely/ux';

import {
    acknowledgementStyles,
    actionsStyles,
    contentStyles,
    descriptionStyles,
    titleStyles
} from './SignOutModal.styles';
import { Button, Checkbox, Modal, Text } from '../../shared';

export type SignOutModalProps = {
    accountName: string;
    onConfirm: () => void;
    onClose: () => void;
};

export const SignOutModal: FC<SignOutModalProps> = props => {
    const { accountName, onConfirm, onClose } = props;

    const t = useTranslate();
    const [isAcknowledged, setIsAcknowledged] = useState(false);

    return (
        <Modal open onOpenChange={isOpen => !isOpen && onClose()}>
            <Modal.Popup closeLabel={t('common.close')}>
                <div className={contentStyles}>
                    <Modal.Title className={titleStyles}>
                        {t('settings.signOutAccount.sheet.title', { name: accountName })}
                    </Modal.Title>
                    <Modal.Description className={descriptionStyles}>
                        {t('settings.signOutAccount.sheet.noDevices.subtitle')}
                    </Modal.Description>

                    <label className={acknowledgementStyles}>
                        <Text variant="bodyM">
                            {t('settings.signOutAccount.sheet.noDevices.checkbox')}
                        </Text>
                        <Checkbox checked={isAcknowledged} onCheckedChange={setIsAcknowledged} />
                    </label>
                </div>

                <div className={actionsStyles}>
                    <Button
                        variant="destructive"
                        isFullWidth
                        disabled={!isAcknowledged}
                        onClick={onConfirm}
                    >
                        {t('settings.signOutAccount.sheet.signOutButton')}
                    </Button>
                    <Button variant="secondary" isFullWidth onClick={onClose}>
                        {t('settings.signOutAccount.sheet.cancelButton')}
                    </Button>
                </div>
            </Modal.Popup>
        </Modal>
    );
};
