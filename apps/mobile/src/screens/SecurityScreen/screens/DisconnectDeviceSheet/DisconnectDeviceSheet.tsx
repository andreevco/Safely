import type { StaticScreenProps } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useRevokeSyncedDevice } from '@safely/ux';

import { BottomSheet, Button, Text, useBottomSheet } from '@mobile/shared/ui';

import { styles } from './DisconnectDeviceSheet.styles';

type DisconnectDeviceSheetProps = StaticScreenProps<{
    deviceName: string;
    ikPubHex: string;
}>;

const DisconnectDeviceContent = (props: DisconnectDeviceSheetProps['route']['params']) => {
    const { deviceName, ikPubHex } = props;

    const { t } = useTranslation();
    const { close } = useBottomSheet();
    const { mutate: revokeDevice, isPending } = useRevokeSyncedDevice();

    const handleDisconnect = () => {
        revokeDevice(ikPubHex, {
            onSuccess: () => close()
        });
    };

    return (
        <View style={styles.content}>
            <View style={styles.titleBox}>
                <Text textAlign="center" variant="titleM">
                    {t('security.unlinkDevice.title', { deviceName })}
                </Text>
                <Text textAlign="center" variant="bodyL" color="secondary">
                    {t('security.unlinkDevice.subtitle')}
                </Text>
            </View>
            <View style={styles.footer}>
                <Button
                    type="destructive"
                    size="large"
                    disabled={isPending}
                    onPress={handleDisconnect}
                >
                    {t('security.unlinkDevice.confirm', { deviceName })}
                </Button>
                <Button type="secondary" size="large" onPress={close}>
                    {t('common.cancel')}
                </Button>
            </View>
        </View>
    );
};

export const DisconnectDeviceSheet = (props: DisconnectDeviceSheetProps) => {
    return (
        <BottomSheet>
            <DisconnectDeviceContent {...props.route.params} />
        </BottomSheet>
    );
};
