import { useState } from 'react';
import { View } from 'react-native';

import type { SyncedDeviceDetails } from '@safely/ux';
import { useDevSetDeviceLastSyncAt, useSyncedDevices, useToast } from '@safely/ux';

import { Button, Cell, Input, List, Screen, Text } from '@mobile/shared/ui';

import { styles } from './DevToolsSyncDevicesScreen.styles';

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

const PRESETS = [
    { label: 'Just now', ago: 0 },
    { label: '5 minutes ago', ago: 5 * MINUTE_MS },
    { label: '3 hours ago', ago: 3 * HOUR_MS },
    { label: 'Yesterday', ago: DAY_MS },
    { label: '4 days ago', ago: 4 * DAY_MS },
    { label: '2 weeks ago', ago: 14 * DAY_MS },
    { label: '40 days ago (stale)', ago: 40 * DAY_MS }
] as const;

const DeviceControls = ({ device }: { device: SyncedDeviceDetails }) => {
    const [minutes, setMinutes] = useState('');
    const toast = useToast();
    const { mutate: setLastSyncAt } = useDevSetDeviceLastSyncAt();

    const apply = (ago: number, label: string) =>
        setLastSyncAt(
            { ikPubHex: device.ikPubHex, lastSyncAt: Date.now() - ago },
            { onSuccess: () => toast(`${device.meta.name}: ${label}`) }
        );

    const parsedMinutes = Number(minutes);
    const isMinutesValid =
        minutes.length > 0 && Number.isFinite(parsedMinutes) && parsedMinutes >= 0;

    return (
        <List>
            <List.Title>
                {device.meta.name}
                {device.isCurrent ? ' (this device)' : ''}
            </List.Title>
            <List.Group variant="divided">
                {PRESETS.map(preset => (
                    <Cell key={preset.label} onPress={() => apply(preset.ago, preset.label)}>
                        <Cell.Content>
                            <Cell.Row>
                                <Cell.Title>{preset.label}</Cell.Title>
                            </Cell.Row>
                        </Cell.Content>
                    </Cell>
                ))}
            </List.Group>
            <View style={styles.customRow}>
                <Input style={styles.customInput}>
                    <Input.Field
                        value={minutes}
                        onChangeText={setMinutes}
                        placeholder="Minutes ago"
                        keyboardType="number-pad"
                        withClearButton
                    />
                </Input>
                <Button
                    type="secondary"
                    size="medium"
                    disabled={!isMinutesValid}
                    onPress={() => apply(parsedMinutes * MINUTE_MS, `${parsedMinutes} minutes ago`)}
                >
                    Apply
                </Button>
            </View>
        </List>
    );
};

export const DevToolsSyncDevicesScreen = () => {
    const devices = useSyncedDevices();

    return (
        <Screen>
            <Screen.Header variant="center">
                <Screen.Header.BackButton />
                <Screen.Header.Title>
                    <Text variant="titleS">Sync devices</Text>
                </Screen.Header.Title>
            </Screen.Header>

            <Screen.Scrollable contentContainerStyle={styles.content}>
                <Text style={styles.hint} variant="bodyM" color="tertiary">
                    Overrides lastSyncAt of a device to test connection labels and the stale
                    warning. Keep that device offline, otherwise it reports its real value back
                    within a minute.
                </Text>

                {devices.map(device => (
                    <DeviceControls key={device.ikPubHex} device={device} />
                ))}
            </Screen.Scrollable>
        </Screen>
    );
};
