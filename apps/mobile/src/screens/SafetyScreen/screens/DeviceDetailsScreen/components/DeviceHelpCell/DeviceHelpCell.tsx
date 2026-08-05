import { useNavigation } from '@react-navigation/core';
import { useTranslation } from 'react-i18next';

import type { SyncedDeviceDetails } from '@safely/ux';
import { SyncedDeviceDataStatus } from '@safely/ux';

import { Cell, List } from '@mobile/shared/ui';

import { styles } from './DeviceHelpCell.styles';

type DeviceHelpCellProps = {
    details: SyncedDeviceDetails;
};

export const DeviceHelpCell = ({ details }: DeviceHelpCellProps) => {
    const { t } = useTranslation();
    const rootNavigation = useNavigation();

    const needsHelp = details.isStale || details.dataStatus !== SyncedDeviceDataStatus.SYNCED;

    if (!needsHelp) {
        return null;
    }

    const handlePress = () => {
        rootNavigation.navigate('DeviceSupportWizardModal', { ikPubHex: details.ikPubHex });
    };

    return (
        <List style={styles.container}>
            <List.Group>
                <Cell onPress={handlePress}>
                    <Cell.Content>
                        <Cell.Row>
                            <Cell.Title>{t('security.deviceDetails.help.title')}</Cell.Title>
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
    );
};
