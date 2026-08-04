import type { StaticScreenProps } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { useEffect } from 'react';
import { View } from 'react-native';

import type { SyncedDeviceDetails } from '@safely/ux';
import { useSyncedDeviceDetails } from '@safely/ux';

import { Screen } from '@mobile/shared/ui';

import { DataSyncBlock, DeviceBlock, DeviceHeaderTitle } from './components';
import { styles } from './DeviceDetailsScreen.styles';

type DeviceDetailsScreenProps = StaticScreenProps<{
    ikPubHex: string;
}>;

const DeviceDetailsContent = ({ details }: { details: SyncedDeviceDetails }) => {
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
                <DataSyncBlock details={details} />
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
