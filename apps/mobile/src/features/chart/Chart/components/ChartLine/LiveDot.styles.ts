import { StyleSheet } from 'react-native-unistyles';

import { DOT_RADIUS } from '@mobile/features/chart/Chart/constants';

const HALO_SIZE = (DOT_RADIUS + 1) * 2;
const DOT_SIZE = DOT_RADIUS * 2;

export const styles = StyleSheet.create(theme => ({
    container: {
        position: 'absolute',
        transform: [{ translateX: -(DOT_RADIUS + 1) }, { translateY: -(DOT_RADIUS + 1) }]
    },
    halo: {
        width: HALO_SIZE,
        height: HALO_SIZE,
        borderRadius: HALO_SIZE / 2,
        backgroundColor: theme.colors.background.secondary,
        alignItems: 'center',
        justifyContent: 'center'
    },
    dot: {
        width: DOT_SIZE,
        height: DOT_SIZE,
        borderRadius: DOT_SIZE / 2
    }
}));
