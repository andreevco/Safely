import { Suspense } from 'react';
import { View } from 'react-native';

import { AccountLinkState, useAccountLinkState } from '@safely/ux';

import { styles } from './SyncDot.styles';

const SyncDotContent = () => {
    return <View style={styles.dot(useAccountLinkState())} />;
};

export const SyncDot = () => {
    return (
        <Suspense fallback={<View style={styles.dot(AccountLinkState.SOLO)} />}>
            <SyncDotContent />
        </Suspense>
    );
};
