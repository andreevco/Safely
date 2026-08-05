import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import type { SyncedDeviceDetails } from '@safely/ux';

import { ChevronRight16, Icon, List, Text, TouchableOpacity } from '@mobile/shared/ui';

import { styles } from './ArchivedDevicesSection.styles';
import { DeviceItem } from '../DeviceItem';

type ArchivedDevicesSectionProps = {
    devices: SyncedDeviceDetails[];
};

export const ArchivedDevicesSection = ({ devices }: ArchivedDevicesSectionProps) => {
    const { t } = useTranslation();
    const [isExpanded, setIsExpanded] = useState(false);

    if (devices.length === 0) {
        return null;
    }

    if (!isExpanded) {
        return (
            <TouchableOpacity style={styles.toggle} onPress={() => setIsExpanded(true)}>
                <Text variant="bodyM" color="tertiary">
                    {t('security.archivedDevices.show')}
                </Text>
                <Icon icon={ChevronRight16} color="tertiary" />
            </TouchableOpacity>
        );
    }

    return (
        <List style={styles.container}>
            <List.Title>{t('security.archivedDevices.title')}</List.Title>
            <View style={styles.rows}>
                {devices.map(device => (
                    <DeviceItem key={device.ikPubHex} device={device} />
                ))}
            </View>
            <Text style={styles.footnote} variant="bodyM" color="tertiary">
                {t('security.archivedDevices.footnote')}
            </Text>
        </List>
    );
};
