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
        borderRadius: theme.radius.md,
        gap: theme.spacing[2]
    }
}));
