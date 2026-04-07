import { Suspense } from 'react';
import { View } from 'react-native';

import { useSyncedDevicesMeta } from '@safely/ux';

import { styles } from './SyncDot.styles';

const SyncDotContent = () => {
    const devicesMeta = useSyncedDevicesMeta();
    const hasLinkedDevices = devicesMeta ? Object.keys(devicesMeta).length - 1 > 0 : false;

    return <View style={styles.dot(hasLinkedDevices)} />;
};

export const SyncDot = () => {
    return (
        <Suspense fallback={<View style={styles.dot(false)} />}>
            <SyncDotContent />
        </Suspense>
    );
};
