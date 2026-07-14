import { useNavigation } from '@react-navigation/core';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import type { SDeviceMeta } from '@safely/sync-storage';
import { useCurrentDeviceIkPub, useDateFormatter, useSyncedDevicesMeta } from '@safely/ux';

import type { PopupMenuRef } from '@mobile/shared/ui';
import { Badge, Button, DeviceLinkCheckmark96, Icon, Screen, Text } from '@mobile/shared/ui';

import { styles } from './ProtectedView.styles';

function DeviceItem(props: { ikPubHex: string; meta: SDeviceMeta; isCurrent: boolean }) {
    const { ikPubHex, meta, isCurrent } = props;

    const { t } = useTranslation();
    const rootNavigation = useNavigation();
    const menuRef = useRef<PopupMenuRef>(null);
    const formatDate = useDateFormatter({ month: 'short', day: 'numeric', year: 'numeric' });

    const handleDisconnect = () => {
        menuRef.current?.close();
        rootNavigation.navigate('DisconnectDeviceSheet', {
            deviceName: meta.name,
            ikPubHex
        });
    };

    return (
        <View style={styles.deviceRow}>
            <View style={styles.deviceInfo}>
                <View style={styles.deviceNameRow}>
                    <Text variant="labelL">{meta.name}</Text>
                    {isCurrent && <Badge isUppercase>{t('security.device.current')}</Badge>}
                </View>
                <Text variant="bodyM" color="tertiary">
                    {t('security.device.added', { date: formatDate.format(meta.pairedAt) })}
                </Text>
            </View>
            {!isCurrent && (
                <Button type="tertiary" size="small" onPress={handleDisconnect}>
                    {t('security.device.unlink')}
                </Button>
            )}
        </View>
    );
}

export const ProtectedView = () => {
    const { t } = useTranslation();
    const devicesMeta = useSyncedDevicesMeta();
    const myIkPubHex = useCurrentDeviceIkPub();

    const currentDevice = devicesMeta?.[myIkPubHex];
    const otherDevices = Object.entries(devicesMeta ?? {}).filter(
        ([ikPubHex]) => ikPubHex !== myIkPubHex
    );
    const devices = currentDevice
        ? [[myIkPubHex, currentDevice] as const, ...otherDevices]
        : otherDevices;

    return (
        <Screen.Scrollable>
            <View style={styles.content}>
                <Icon icon={DeviceLinkCheckmark96} />
                <View style={styles.textContainer}>
                    <Text textAlign="center" variant="titleM">
                        {t('security.accountProtected.title')}
                    </Text>
                    <Text textAlign="center" variant="bodyL" color="secondary">
                        {t('security.accountProtected.subtitle')}
                    </Text>
                </View>
                <View style={styles.deviceList}>
                    {devices.map(([ikPubHex, meta]) => (
                        <DeviceItem
                            key={ikPubHex}
                            ikPubHex={ikPubHex}
                            meta={meta}
                            isCurrent={ikPubHex === myIkPubHex}
                        />
                    ))}
                </View>
            </View>
        </Screen.Scrollable>
    );
};
