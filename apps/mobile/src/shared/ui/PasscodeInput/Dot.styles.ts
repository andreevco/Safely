import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    container: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.colors.other.transparentElement,
        backgroundColor: theme.colors.input.background,
        borderRadius: theme.radius.md
    },
    dot: {
        width: 16,
        height: 16,
        borderRadius: theme.radius.full
    }
}));
