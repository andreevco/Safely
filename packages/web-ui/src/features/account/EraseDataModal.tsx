import type { FC } from 'react';

import { useTranslate } from '@safely/ux';

import {
    actionsStyles,
    contentStyles,
    descriptionStyles,
    titleStyles
} from './EraseDataModal.styles';
import { Button, Modal } from '../../shared';

export type EraseDataModalProps = {
    onConfirm: () => void;
    onClose: () => void;
};

export const EraseDataModal: FC<EraseDataModalProps> = props => {
    const { onConfirm, onClose } = props;

    const t = useTranslate();

    return (
        <Modal open onOpenChange={isOpen => !isOpen && onClose()}>
            <Modal.Popup closeLabel={t('common.close')}>
                <div className={contentStyles}>
                    <Modal.Title className={titleStyles}>
                        {t('logOutAllAccounts.title')}
                    </Modal.Title>
                    <Modal.Description className={descriptionStyles}>
                        {t('logOutAllAccounts.message')}
                    </Modal.Description>
                </div>

                <div className={actionsStyles}>
                    <Button variant="destructive" isFullWidth onClick={onConfirm}>
                        {t('logOutAllAccounts.slider.label')}
                    </Button>
                    <Button variant="secondary" isFullWidth onClick={onClose}>
                        {t('logOutAllAccounts.cancel')}
                    </Button>
                </div>
            </Modal.Popup>
        </Modal>
    );
};
