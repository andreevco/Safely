import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: theme.colors.background.overlay
    },
    menu: {
        position: 'absolute',
        left: theme.spacing[48],
        right: theme.spacing[48],
        gap: theme.spacing[8],
        zIndex: 1000
    }
}));
