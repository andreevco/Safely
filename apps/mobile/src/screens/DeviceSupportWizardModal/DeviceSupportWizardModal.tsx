import type { StaticScreenProps } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useBootConfig, useLinking, useSyncedDeviceDetails } from '@safely/ux';

import { Button, DeviceExclamationmark96, Icon, Screen, Text } from '@mobile/shared/ui';

import { styles } from './DeviceSupportWizardModal.styles';

type DeviceSupportWizardModalProps = StaticScreenProps<{
    ikPubHex: string;
}>;

export const DeviceSupportWizardModal = (props: DeviceSupportWizardModalProps) => {
    const { t } = useTranslation();
    const { openURL } = useLinking();
    const details = useSyncedDeviceDetails(props.route.params.ikPubHex);
    const supportEmail = useBootConfig().references.support.email;

    const deviceName = details?.meta.name ?? '';

    return (
        <Screen>
            <Screen.Header>
                <Button
                    style={styles.headerButton}
                    size="small"
                    type="secondary"
                    onPress={() => openURL(`mailto:${supportEmail}`)}
                >
                    {t('deviceSupportWizard.title')}
                </Button>
                <Screen.Header.Title />
                <Screen.Header.CloseButton />
            </Screen.Header>
            <Screen.Scrollable contentContainerStyle={styles.content}>
                <Icon icon={DeviceExclamationmark96} />
                <View style={styles.textContainer}>
                    <Text textAlign="center" variant="titleM">
                        {t('deviceSupportWizard.intro.title', { deviceName })}
                    </Text>
                    <Text textAlign="center" variant="bodyL" color="secondary">
                        {t('deviceSupportWizard.intro.subtitle', { deviceName })}
                    </Text>
                </View>
            </Screen.Scrollable>
        </Screen>
    );
};
