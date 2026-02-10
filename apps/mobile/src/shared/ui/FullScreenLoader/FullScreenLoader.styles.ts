import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: theme.colors.background.overlay
    },
    container: {
        width: 96,
        height: 96,
        borderRadius: theme.radius.lg,
        backgroundColor: theme.colors.background.tertiary,
        justifyContent: 'center',
        alignItems: 'center'
    }
}));
