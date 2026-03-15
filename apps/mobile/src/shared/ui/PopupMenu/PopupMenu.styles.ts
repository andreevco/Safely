import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#000000A3'
    },
    menu: {
        position: 'absolute',
        gap: theme.spacing[8],
        zIndex: 1000
    },
    menuCentered: {
        left: theme.spacing[48],
        right: theme.spacing[48]
    }
}));
