import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    container: {
        paddingHorizontal: theme.spacing[8],
        gap: theme.spacing[8]
    },
    button: {
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.colors.other.transparentElement,
        borderRadius: theme.radius.xs,
        paddingVertical: theme.spacing[8] - 2,
        paddingHorizontal: theme.spacing[8]
    }
}));
