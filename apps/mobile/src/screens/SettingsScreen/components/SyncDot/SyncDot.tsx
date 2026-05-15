import { View } from 'react-native';

import { useAccountLinkState } from '@safely/ux';

import { styles } from './SyncDot.styles';

export const SyncDot = () => {
    const linkState = useAccountLinkState();

    return <View style={styles.dot(linkState)} />;
};
