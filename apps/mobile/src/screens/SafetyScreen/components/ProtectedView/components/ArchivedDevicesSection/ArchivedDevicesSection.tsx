import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useSyncedDevices } from '@safely/ux';

import { ChevronRight16, Icon, List, Text, TouchableOpacity } from '@mobile/shared/ui';

import { styles } from './ArchivedDevicesSection.styles';
import { DeviceItem } from '../DeviceItem';

export const ArchivedDevicesSection = ({ onExpand }: { onExpand: () => void }) => {
    const { t } = useTranslation();
    const [isExpanded, setIsExpanded] = useState(false);
    const devices = useSyncedDevices().filter(device => device.archive !== null);

    const handleExpand = () => {
        onExpand();
        setIsExpanded(true);
    };

    if (devices.length === 0) {
        return null;
    }

    if (!isExpanded) {
        return (
            <TouchableOpacity style={styles.toggle} onPress={handleExpand}>
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
