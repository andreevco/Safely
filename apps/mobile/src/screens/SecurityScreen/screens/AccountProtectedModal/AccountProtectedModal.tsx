import { useNavigation } from '@react-navigation/native';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import type { SDeviceMeta } from '@safely/sync-storage';
import {
    useAppContext,
    useConnectAccountToNewDevice,
    useCurrentDeviceIkPub,
    useSyncedDevicesMeta
} from '@safely/ux';
import { useDateFormatter } from '@safely/ux';

import type { RootStackNavigationProp } from '@mobile/app/navigation/types';
import type { PopupMenuRef } from '@mobile/shared/ui';
import {
    Badge,
    Block16,
    DeviceLinkCheckmark96,
    Icon,
    More28,
    PopupMenu,
    Screen,
    Text
} from '@mobile/shared/ui';

import { styles } from './AccountProtectedModal.styles';

function formatOsBadge(platform: 'ios' | 'android', osVersion: string): string {
    return platform === 'ios' ? `iOS ${osVersion}` : `Android ${osVersion}`;
}

function DeviceItem(props: { ikPubHex: string; meta: SDeviceMeta }) {
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
                <Text variant="bodyM" color="tertiary">
                    {t('security.device.added', { date: formatDate.format(meta.pairedAt) })}
                </Text>
            </View>
            <PopupMenu
                ref={menuRef}
                hasBackdrop={false}
                variant="compact"
                touchable={<Icon icon={More28} color="tertiary" />}
            >
                <Pressable onPress={handleDisconnect}>
                    <View style={styles.menuItem}>
                        <Text variant="labelL">{t('security.device.unlink')}</Text>
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
    const {
        storage: {
            sync: { getSecureEncrypted }
        }
    } = useAppContext();
    const { mutateAsync: connectToNewDevice } = useConnectAccountToNewDevice();
    const devicesMeta = useSyncedDevicesMeta();
    const myIkPubHex = useCurrentDeviceIkPub();

    const handleAddDevice = async () => {
        using secureEncryptedStorage = getSecureEncrypted();
        await secureEncryptedStorage.unlock();

        await connectToNewDevice({ secureEncryptedStorage });
    };

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
                <Screen.Header.Title />
                <Screen.Header.Button type="small" onPress={handleAddDevice}>
                    <Text variant="labelM" color="primary">
                        {t('onboarding.accountCreated.addDevice')}
                    </Text>
                </Screen.Header.Button>
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
