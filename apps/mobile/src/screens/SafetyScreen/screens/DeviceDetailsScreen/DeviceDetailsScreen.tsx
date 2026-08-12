import type { StaticScreenProps } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import type { SyncedDeviceDetails } from '@safely/ux';
import { useSecurityCheck, useSyncedDeviceDetails, useToast, useUnarchiveDevice } from '@safely/ux';

import { Button, Screen } from '@mobile/shared/ui';

import { DataSyncBlock, DeviceBlock, DeviceHelpCell, DeviceHeaderTitle } from './components';
import { styles } from './DeviceDetailsScreen.styles';

type DeviceDetailsScreenProps = StaticScreenProps<{
    ikPubHex: string;
}>;

const DeviceDetailsContent = ({ details }: { details: SyncedDeviceDetails }) => {
    const { t } = useTranslation();
    const toast = useToast();
    const check = useSecurityCheck();
    const navigation = useNavigation();
    const { mutateAsync: unarchiveDevice } = useUnarchiveDevice();

    const deviceName = details.meta.name;

    const handleUnarchive = async () => {
        await check({ subtitle: t('security.deviceDetails.unarchiveVerify', { deviceName }) });
        await unarchiveDevice(details.ikPubHex);

        navigation.goBack();
        toast(t('security.deviceDetails.unarchived', { deviceName }));
    };

    return (
        <Screen>
            <Screen.Header variant="center">
                <Screen.Header.BackButton />
                <Screen.Header.Title>
                    <DeviceHeaderTitle details={details} />
                </Screen.Header.Title>
                <View style={styles.headerPlaceholder} />
            </Screen.Header>
            <Screen.Scrollable contentContainerStyle={styles.content}>
                <DeviceBlock details={details} />
                {details.archive === null && (
                    <>
                        <DataSyncBlock details={details} />
                        <DeviceHelpCell details={details} />
                    </>
                )}
                {details.archive !== null && !details.archive.isSignedOut && (
                    <Button
                        style={styles.unarchiveButton}
                        size="large"
                        type="secondary"
                        onPress={handleUnarchive}
                    >
                        {t('security.deviceDetails.unarchive', { deviceName })}
                    </Button>
                )}
            </Screen.Scrollable>
        </Screen>
    );
};

export const DeviceDetailsScreen = (props: DeviceDetailsScreenProps) => {
    const navigation = useNavigation();
    const details = useSyncedDeviceDetails(props.route.params.ikPubHex);

    useEffect(() => {
        if (details === null) {
            navigation.goBack();
        }
    }, [details, navigation]);

    return details === null ? null : <DeviceDetailsContent details={details} />;
};
