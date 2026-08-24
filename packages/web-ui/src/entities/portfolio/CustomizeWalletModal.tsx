import type { FC } from 'react';
import { useState } from 'react';

import type { PortfolioMeta, PortfolioMetaIcon } from '@safely/core';
import { useTranslate } from '@safely/ux';
import Xmark16 from '@safely/ux/assets/icons/16/xmark-16.svg?react';

import {
    descriptionStyles,
    fieldStyles,
    headerStyles,
    headingStyles,
    popupStyles,
    titleStyles
} from './CustomizeWalletModal.styles';
import { IconPicker } from './IconPicker';
import { WalletIcon } from './WalletIcon';
import { Button, Icon, Input, Modal } from '../../shared';

export type CustomizeWalletModalProps = {
    defaultName: string;
    defaultIcon: PortfolioMetaIcon;
    onSave: (meta: Pick<PortfolioMeta, 'name' | 'icon'>) => void;
    onClose: () => void;
};

export const CustomizeWalletModal: FC<CustomizeWalletModalProps> = props => {
    const { defaultName, defaultIcon, onSave, onClose } = props;

    const t = useTranslate();
    const [name, setName] = useState(defaultName);
    const [icon, setIcon] = useState<PortfolioMetaIcon>(defaultIcon);

    return (
        <Modal open onOpenChange={isOpen => !isOpen && onClose()}>
            <Modal.Popup className={popupStyles} hasClose={false} closeLabel={t('common.close')}>
                <div className={headerStyles}>
                    <Button
                        variant="secondary"
                        size="small"
                        isIconOnly
                        aria-label={t('common.close')}
                        onClick={onClose}
                    >
                        <Icon asset={Xmark16} />
                    </Button>

                    <Button
                        variant="primary"
                        size="small"
                        disabled={name.trim().length === 0}
                        onClick={() => onSave({ name: name.trim(), icon })}
                    >
                        {t('customizeWallet.save')}
                    </Button>
                </div>

                <div className={headingStyles}>
                    <Modal.Title className={titleStyles}>{t('customizeWallet.title')}</Modal.Title>
                    <Modal.Description className={descriptionStyles}>
                        {t('customizeWallet.description')}
                    </Modal.Description>
                </div>

                <div className={fieldStyles}>
                    <Input>
                        <Input.Field
                            value={name}
                            placeholder={t('customizeWallet.namePlaceholder')}
                            onChange={event => setName(event.target.value)}
                            trailing={<WalletIcon icon={icon} size="medium" />}
                        />
                    </Input>
                </div>

                <IconPicker icon={icon} onChange={setIcon} />
            </Modal.Popup>
        </Modal>
    );
};
