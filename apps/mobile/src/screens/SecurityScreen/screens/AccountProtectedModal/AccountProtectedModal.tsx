import { useNavigation } from '@react-navigation/native';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { useDevicesMeta, useMyDeviceIkPub } from '@safely/ux';
import { useDateFormatter } from '@safely/ux/shared/format/date';
import { DeviceMeta } from '@safely/ux/shared/storage/account/synced/schemas';

import { RootStackNavigationProp } from '@mobile/app/navigation/types';
import {
    Badge,
    Block16,
    DeviceLinkCheckmark96,
    Icon,
    More28,
    PopupMenu,
    PopupMenuRef,
    Screen,
    Text
} from '@mobile/shared/ui';

import { styles } from './AccountProtectedModal.styles';

function formatOsBadge(platform: 'ios' | 'android', osVersion: string): string {
    return platform === 'ios' ? `iOS ${osVersion}` : `Android ${osVersion}`;
}

function DeviceItem(props: { ikPubHex: string; meta: DeviceMeta }) {
    const { ikPubHex, meta } = props;

    const { t } = useTranslation();
    const rootNavigation = useNavigation<RootStackNavigationProp>();
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
                    <Badge>{formatOsBadge(meta.platform, meta.osVersion)}</Badge>
                </View>
                <Text variant="bodyM" color="secondary">
                    {t('security.device.added', { date: formatDate.format(meta.lastSyncedAt) })}
                </Text>
                <Text variant="bodyM" color="tertiary">
                    {t('security.device.upToDate')}
                </Text>
            </View>
            <PopupMenu
                ref={menuRef}
                hasBlur={false}
                touchable={<Icon icon={More28} color="tertiary" />}
            >
                <Pressable onPress={handleDisconnect}>
                    <View style={styles.menuItem}>
                        <Text variant="labelL">{t('security.device.disconnect')}</Text>
                        <Icon icon={Block16} />
                    </View>
                </Pressable>
            </PopupMenu>
        </View>
    );
}

export const AccountProtectedModal = () => {
    const { t } = useTranslation();
    const navigation = useNavigation();
    const devicesMeta = useDevicesMeta();
    const myIkPubHex = useMyDeviceIkPub();

    const devices = Object.entries(devicesMeta ?? {}).filter(
        ([ikPubHex]) => ikPubHex !== myIkPubHex
    );

    useEffect(() => {
        if (devices.length === 0) {
            navigation.goBack();
        }
    }, [devices.length, navigation]);

    return (
        <Screen>
            <Screen.Header>
                <Screen.Header.BackButton />
            </Screen.Header>
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
                            <DeviceItem key={ikPubHex} ikPubHex={ikPubHex} meta={meta} />
                        ))}
                    </View>
                </View>
            </Screen.Scrollable>
        </Screen>
    );
};
