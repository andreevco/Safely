import { View } from 'react-native';

import { AccountLinkState, useAccountLinkState } from '@safely/ux';

import { styles } from './SyncDot.styles';

export const SyncDot = () => {
    const linkState = useAccountLinkState() ?? AccountLinkState.SOLO;

    return <View style={styles.dot(linkState)} />;
};
