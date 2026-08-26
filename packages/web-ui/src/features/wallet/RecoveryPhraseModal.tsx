import type { FC } from 'react';

import { useTranslate } from '@safely/ux';
import ExclamationmarkCircle16 from '@safely/ux/assets/icons/16/exclamationmark-circle-16.svg?react';

import { toRecoveryPhraseRows } from './recovery-phrase-rows';
import {
    bannerStyles,
    bannerTextStyles,
    headerStyles,
    indexStyles,
    listStyles,
    popupStyles,
    titleStyles
} from './RecoveryPhraseModal.styles';
import { Icon, List, Modal, ScreenProtection, TableCell, Text } from '../../shared';

export type RecoveryPhraseModalProps = {
    mnemonic: string[];
    walletName: string;
    onClose: () => void;
};

export const RecoveryPhraseModal: FC<RecoveryPhraseModalProps> = props => {
    const { mnemonic, walletName, onClose } = props;

    const t = useTranslate();

    return (
        <ScreenProtection>
            <Modal open disablePointerDismissal onOpenChange={isOpen => !isOpen && onClose()}>
                <Modal.Popup className={popupStyles} closeLabel={t('common.close')}>
                    <div className={headerStyles}>
                        <Modal.Title className={titleStyles}>
                            {`“${walletName}” ${t('security.phraseSheet.titleSuffix')}`}
                        </Modal.Title>
                    </div>

                    <div className={bannerStyles}>
                        <Text variant="bodyM" tone="accentRed" className={bannerTextStyles}>
                            {t('security.phraseSheet.warning')}
                        </Text>
                        <Icon asset={ExclamationmarkCircle16} tone="accentRed" />
                    </div>

                    <List className={listStyles}>
                        <List.Group variant="divided">
                            {toRecoveryPhraseRows(mnemonic).map((row, rowIndex) => (
                                <TableCell key={rowIndex} hasColumnDivider>
                                    {row.map(entry => (
                                        <TableCell.Column key={entry.index}>
                                            <TableCell.Value>
                                                <span className={indexStyles}>
                                                    {entry.index + 1}.
                                                </span>
                                                {entry.word}
                                            </TableCell.Value>
                                        </TableCell.Column>
                                    ))}
                                </TableCell>
                            ))}
                        </List.Group>
                    </List>
                </Modal.Popup>
            </Modal>
        </ScreenProtection>
    );
};
