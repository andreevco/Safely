import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { SyncedDeviceDataStatus, useSyncedDevices } from '@safely/ux';

import { Banner, Button, DeviceLinkCheckmark96, Icon, List, Screen, Text } from '@mobile/shared/ui';

import { DeviceItem } from './components';
import { styles } from './ProtectedView.styles';

type ProtectedViewProps = {
    onLinkDevice: () => void;
    onAbout: () => void;
};

export const ProtectedView = (props: ProtectedViewProps) => {
    const { onLinkDevice, onAbout } = props;

    const { t } = useTranslation();
    const devices = useSyncedDevices();
    const needsAttention = devices.some(
        device => device.isStale || device.dataStatus !== SyncedDeviceDataStatus.SYNCED
    );

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
                <List style={styles.deviceList}>
                    <List.Title>{t('security.accountProtected.listTitle')}</List.Title>
                    {needsAttention && (
                        <Banner variant="danger" nonInteractive style={styles.attentionBanner}>
                            <Banner.Content>
                                <Banner.Text>
                                    {t('security.accountProtected.attention')}
                                </Banner.Text>
                            </Banner.Content>
                        </Banner>
                    )}
                    <View style={styles.deviceRows}>
                        {devices.map(device => (
                            <DeviceItem key={device.ikPubHex} device={device} devices={devices} />
                        ))}
                    </View>
                </List>
            </View>
        </Screen.Scrollable>
    );
};
