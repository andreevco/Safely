import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import type { SyncedDeviceDetails } from '@safely/ux';

import { Text } from '@mobile/shared/ui';

import { styles } from './DeviceHeaderTitle.styles';

type DeviceHeaderTitleProps = {
    details: SyncedDeviceDetails;
};

function captionKey(details: SyncedDeviceDetails): string | null {
    if (details.archive !== null) {
        return 'security.deviceDetails.archivedDevice';
    }

    if (details.isCurrent) {
        return 'security.deviceDetails.currentDevice';
    }

    return null;
}

export const DeviceHeaderTitle = ({ details }: DeviceHeaderTitleProps) => {
    const { t } = useTranslation();

    const caption = captionKey(details);

    return (
        <View style={styles.container}>
            <Text variant="titleS" numberOfLines={1}>
                {details.meta.name}
            </Text>
            {caption !== null && (
                <Text variant="bodyM" color="secondary" numberOfLines={1}>
                    {t(caption)}
                </Text>
            )}
        </View>
    );
};
