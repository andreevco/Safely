import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { ScrollView } from 'react-native';
import { View } from 'react-native';

import { useIsAttentionRequired, useSyncedDevices } from '@safely/ux';

import { Banner, Button, DeviceLinkCheckmark96, Icon, List, Screen, Text } from '@mobile/shared/ui';

import { ArchivedDevicesSection, DeviceItem } from './components';
import { styles } from './ProtectedView.styles';

type ProtectedViewProps = {
    onLinkDevice: () => void;
    onAbout: () => void;
};

export const ProtectedView = ({ onLinkDevice, onAbout }: ProtectedViewProps) => {
    const { t } = useTranslation();
    const scrollRef = useRef<ScrollView>(null);
    const shouldScrollToEndRef = useRef(false);
    const devices = useSyncedDevices().filter(device => device.archive === null);
    const isAttentionRequired = useIsAttentionRequired();

    const handleContentSizeChange = () => {
        if (!shouldScrollToEndRef.current) return;

        shouldScrollToEndRef.current = false;
        scrollRef.current?.scrollToEnd();
    };

    const handleExpand = () => {
        shouldScrollToEndRef.current = true;
    };

    return (
        <Screen.Scrollable ref={scrollRef} onContentSizeChange={handleContentSizeChange}>
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
                    {isAttentionRequired && (
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
                            <DeviceItem key={device.ikPubHex} device={device} />
                        ))}
                    </View>
                </List>
                <ArchivedDevicesSection onExpand={handleExpand} />
            </View>
        </Screen.Scrollable>
    );
};
