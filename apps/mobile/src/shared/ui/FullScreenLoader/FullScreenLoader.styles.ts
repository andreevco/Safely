import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
    },
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
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
