import { useNavigation } from '@react-navigation/core';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import type { SDeviceMeta } from '@safely/sync-storage';
import { useCurrentDeviceIkPub, useDateFormatter, useSyncedDevicesMeta } from '@safely/ux';

import {
    Badge,
    Button,
    ChevronRight16,
    DeviceLinkCheckmark96,
    Icon,
    Screen,
    Text,
    TouchableOpacity
} from '@mobile/shared/ui';

import { styles } from './ProtectedView.styles';

function DeviceItem(props: { ikPubHex: string; meta: SDeviceMeta; isCurrent: boolean }) {
    const { ikPubHex, meta, isCurrent } = props;

    const { t } = useTranslation();
    const rootNavigation = useNavigation();
    const formatDate = useDateFormatter({ month: 'short', day: 'numeric', year: 'numeric' });

    const handlePress = () => {
        rootNavigation.navigate('DeviceDetailsScreen', { ikPubHex });
    };

    return (
        <TouchableOpacity style={styles.deviceRow} onPress={handlePress}>
            <View style={styles.deviceInfo}>
                <View style={styles.deviceNameRow}>
                    <Text variant="labelL">{meta.name}</Text>
                    {isCurrent && <Badge isUppercase>{t('security.device.current')}</Badge>}
                </View>
                <Text variant="bodyM" color="tertiary">
                    {t('security.device.added', { date: formatDate.format(meta.pairedAt) })}
                </Text>
            </View>
            <Icon icon={ChevronRight16} color="tertiary" />
        </TouchableOpacity>
    );
}

type ProtectedViewProps = {
    onLinkDevice: () => void;
    onAbout: () => void;
};

export const ProtectedView = (props: ProtectedViewProps) => {
    const { onLinkDevice, onAbout } = props;

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
                <View style={styles.buttonsRow}>
                    <Button size="small" type="secondary" onPress={onLinkDevice}>
                        {t('safety.linkDevice')}
                    </Button>
                    <Button size="small" type="secondary" onPress={onAbout}>
                        {t('safety.about')}
                    </Button>
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
