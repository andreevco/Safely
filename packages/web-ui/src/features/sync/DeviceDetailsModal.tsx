import type { FC } from 'react';

import type { SyncedDeviceDetails } from '@safely/ux';
import {
    useSecurityCheck,
    useSyncedDeviceDetails,
    useToast,
    useTranslate,
    useUnarchiveDevice
} from '@safely/ux';

import { DataSyncList } from './DataSyncList';
import { listsStyles, popupStyles } from './DeviceDetailsModal.styles';
import { DeviceInfoList } from './DeviceInfoList';
import { Button, Cell, List, Modal } from '../../shared';

type DeviceDetailsContentProps = {
    details: SyncedDeviceDetails;
    onOpenHelp: () => void;
    onClose: () => void;
};

const DeviceDetailsContent: FC<DeviceDetailsContentProps> = props => {
    const { details, onOpenHelp, onClose } = props;

    const t = useTranslate();
    const toast = useToast();
    const check = useSecurityCheck();
    const { mutateAsync: unarchiveDevice } = useUnarchiveDevice();

    const deviceName = details.meta.name;
    const isSignedOut = details.archive?.isSignedOut ?? false;

    const handleUnarchive = async (): Promise<void> => {
        await check({ subtitle: t('security.deviceDetails.unarchiveVerify', { deviceName }) });
        await unarchiveDevice(details.ikPubHex);

        onClose();
        toast(t('security.deviceDetails.unarchived', { deviceName }));
    };

    return (
        <>
            <Modal.Header closeLabel={t('common.close')} title={deviceName} align="start" />

            <div className={listsStyles}>
                <DeviceInfoList details={details} />

                {!isSignedOut && <DataSyncList details={details} />}

                {details.archive === null && !details.isCurrent && (
                    <List>
                        <List.Group>
                            <Cell onClick={onOpenHelp}>
                                <Cell.Content>
                                    <Cell.Row>
                                        <Cell.Title>
                                            {t('security.deviceDetails.help.title')}
                                        </Cell.Title>
                                    </Cell.Row>
                                    <Cell.Row>
                                        <Cell.Subtitle>
                                            {t('security.deviceDetails.help.subtitle')}
                                        </Cell.Subtitle>
                                    </Cell.Row>
                                </Cell.Content>
                                <Cell.Chevron />
                            </Cell>
                        </List.Group>
                    </List>
                )}

                {details.archive !== null && !details.archive.isSignedOut && (
                    <Button
                        variant="secondary"
                        isFullWidth
                        onClick={() => void handleUnarchive().catch(() => undefined)}
                    >
                        {t('security.deviceDetails.unarchive', { deviceName })}
                    </Button>
                )}
            </div>
        </>
    );
};

export type DeviceDetailsModalProps = {
    ikPubHex: string;
    onOpenHelp: () => void;
    onClose: () => void;
};

export const DeviceDetailsModal: FC<DeviceDetailsModalProps> = props => {
    const { ikPubHex, onOpenHelp, onClose } = props;

    const t = useTranslate();
    const details = useSyncedDeviceDetails(ikPubHex);

    return (
        <Modal open onOpenChange={isOpen => !isOpen && onClose()}>
            <Modal.Popup className={popupStyles} closeLabel={t('common.close')} hasClose={false}>
                {details !== null && (
                    <DeviceDetailsContent
                        details={details}
                        onOpenHelp={onOpenHelp}
                        onClose={onClose}
                    />
                )}
            </Modal.Popup>
        </Modal>
    );
};
